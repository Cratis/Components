// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
    createCompatibilityManifest,
    serializeCompatibilityManifest,
    validateCompatibilityManifest,
} from './generate-compat-manifest.mjs';
import {
    bindSbomToArchive,
    computeFileHashes,
    packageArtifactStem,
    readPackedPackageJson,
    selectReleasePackages,
    validateCommit,
    validatePackedIdentity,
    validateReleaseEvidenceIndex,
    validateSafeFilename,
} from './lib/release-evidence.mjs';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);
const generatedBuildDirectories = [
    'Source/dist',
    'Conformance/dist',
    'Adapters/Mui/dist',
    'Adapters/PrimeReact/dist',
    'Adapters/PrimeReact10/dist',
];

const parseArguments = (arguments_) => {
    let output;
    let commit;
    for (let index = 0; index < arguments_.length; index += 1) {
        const argument = arguments_[index];
        if (argument === '--output' || argument === '--commit') {
            const value = arguments_[index + 1];
            if (!value || value.startsWith('--'))
                throw new Error(`Missing value for ${argument}.`);
            if (argument === '--output') output = value;
            else commit = value;
            index += 1;
            continue;
        }
        throw new Error(`Unknown argument '${argument}'.`);
    }
    if (!output) {
        throw new Error(
            'Usage: node scripts/generate-release-evidence.mjs --output <directory> [--commit <40-hex>].',
        );
    }
    return { output, commit };
};

const run = (command, arguments_, options = {}) => {
    const result = spawnSync(command, arguments_, {
        cwd: options.cwd ?? repositoryDirectory,
        env: options.env ?? process.env,
        encoding: 'utf8',
        stdio: options.capture ? 'pipe' : 'inherit',
        timeout: options.timeout ?? 15 * 60_000,
        windowsHide: true,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        const output = options.capture ? `\n${result.stderr || result.stdout}` : '';
        throw new Error(
            `${command} ${arguments_.join(' ')} failed with exit code ${result.status}.${output}`,
        );
    }
    return options.capture ? result.stdout.trim() : '';
};

const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';

const readJsonFile = (filePath, description) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(
            `Could not read ${description}: ${error instanceof Error ? error.message : String(error)}.`,
            { cause: error },
        );
    }
};

const loadCompatibilityMetadata = () => {
    const manifestPath = path.join(repositoryDirectory, 'compat-manifest.json');
    const serialized = fs.readFileSync(manifestPath, 'utf8');
    const manifest = readJsonFile(manifestPath, 'compat-manifest.json');
    if (manifest.publicationEnabled !== false) {
        throw new Error('Source-candidate evidence refuses publicationEnabled: true.');
    }
    validateCompatibilityManifest(manifest, { rootDirectory: repositoryDirectory });
    const generated = createCompatibilityManifest(repositoryDirectory);
    if (serialized !== serializeCompatibilityManifest(generated)) {
        throw new Error(
            'compat-manifest.json is not the current deterministic compatibility metadata.',
        );
    }
    return manifest;
};

const discoverWorkspaces = () => {
    const rootPackage = readJsonFile(
        path.join(repositoryDirectory, 'package.json'),
        'root package.json',
    );
    if (!Array.isArray(rootPackage.workspaces))
        throw new Error('Root workspaces must be an array.');
    const workspaces = new Map();
    const addWorkspace = (relativeDirectory) => {
        const manifestPath = path.join(
            repositoryDirectory,
            relativeDirectory,
            'package.json',
        );
        if (!fs.existsSync(manifestPath)) return;
        const manifest = readJsonFile(manifestPath, `${relativeDirectory} package.json`);
        if (typeof manifest.name !== 'string' || workspaces.has(manifest.name)) {
            throw new Error(
                `Invalid or duplicate workspace '${manifest.name ?? relativeDirectory}'.`,
            );
        }
        workspaces.set(manifest.name, {
            directory: path.join(repositoryDirectory, relativeDirectory),
            manifest,
        });
    };
    for (const workspacePattern of rootPackage.workspaces) {
        if (typeof workspacePattern !== 'string')
            throw new Error('Workspace patterns must be strings.');
        if (workspacePattern.endsWith('/*')) {
            const relativeParent = workspacePattern.slice(0, -2);
            const parent = path.join(repositoryDirectory, relativeParent);
            for (const entry of fs
                .readdirSync(parent, { withFileTypes: true })
                .sort((left, right) => left.name.localeCompare(right.name))) {
                if (entry.isDirectory())
                    addWorkspace(path.join(relativeParent, entry.name));
            }
        } else {
            addWorkspace(workspacePattern);
        }
    }
    return workspaces;
};

const prepareOutputDirectory = (outputArgument) => {
    const outputDirectory = path.resolve(outputArgument);
    let created = false;
    if (fs.existsSync(outputDirectory)) {
        if (!fs.statSync(outputDirectory).isDirectory())
            throw new Error('Evidence output must be a directory.');
        if (fs.readdirSync(outputDirectory).length > 0)
            throw new Error('Evidence output directory must be empty.');
    } else {
        fs.mkdirSync(outputDirectory, { recursive: true });
        created = true;
    }
    return { outputDirectory, created };
};

const cleanFailureState = (outputDirectory, outputCreated) => {
    for (const relativeDirectory of generatedBuildDirectories) {
        fs.rmSync(path.join(repositoryDirectory, relativeDirectory), {
            recursive: true,
            force: true,
        });
    }
    if (outputDirectory) {
        if (outputCreated) fs.rmSync(outputDirectory, { recursive: true, force: true });
        else {
            for (const entry of fs.readdirSync(outputDirectory)) {
                fs.rmSync(path.join(outputDirectory, entry), {
                    recursive: true,
                    force: true,
                });
            }
        }
    }
};

const buildPublishableShape = (releasePackages) => {
    for (const packageEntry of releasePackages) {
        let task;
        if (packageEntry.role === 'core') task = 'prepare';
        else if (['conformance', 'renderer-adapter'].includes(packageEntry.role)) {
            task = 'build';
        }
        if (task) run(yarnCommand, ['workspace', packageEntry.name, 'run', task]);
    }
};

const createSbom = ({ workspaceDirectory, sbomPath, packageEntry, archive, commit }) => {
    const binDirectory = path.join(repositoryDirectory, 'node_modules', '.bin');
    const environment = {
        ...process.env,
        PATH: `${binDirectory}${path.delimiter}${process.env.PATH ?? ''}`,
    };
    run(
        yarnCommand,
        [
            'exec',
            'cyclonedx-yarn',
            '--production',
            '--mc-type',
            'library',
            '--spec-version',
            '1.6',
            '--output-format',
            'JSON',
            '--output-reproducible',
            '--output-file',
            sbomPath,
        ],
        { cwd: workspaceDirectory, env: environment },
    );
    const sbom = readJsonFile(sbomPath, `${packageEntry.name} SBOM`);
    bindSbomToArchive(sbom, {
        name: packageEntry.name,
        version: packageEntry.version,
        sha512: archive.sha512,
        tarball: archive.tarball,
        commit,
    });
    fs.writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
};

export function generateReleaseEvidence({ output, commit: requestedCommit } = {}) {
    let outputDirectory;
    let outputCreated = false;
    try {
        const compatibilityManifest = loadCompatibilityMetadata();
        const releasePackages = selectReleasePackages(compatibilityManifest);
        const workspaces = discoverWorkspaces();
        const preparedOutput = prepareOutputDirectory(output);
        outputDirectory = preparedOutput.outputDirectory;
        outputCreated = preparedOutput.created;
        const commit = validateCommit(
            requestedCommit ??
                run('git', ['rev-parse', 'HEAD'], { capture: true, timeout: 30_000 }),
        );

        for (const packageEntry of releasePackages) {
            const workspace = workspaces.get(packageEntry.name);
            if (!workspace)
                throw new Error(
                    `Public package '${packageEntry.name}' is not a workspace.`,
                );
            validatePackedIdentity(workspace.manifest, packageEntry);
        }

        buildPublishableShape(releasePackages);

        const packageEvidence = [];
        for (const packageEntry of releasePackages) {
            const workspace = workspaces.get(packageEntry.name);
            const stem = packageArtifactStem(packageEntry.name, packageEntry.version);
            const tarball = validateSafeFilename(`${stem}.tgz`, 'tarball filename');
            const sbom = validateSafeFilename(`${stem}.cdx.json`, 'SBOM filename');
            const archivePath = path.join(outputDirectory, tarball);
            const sbomPath = path.join(outputDirectory, sbom);

            run(yarnCommand, ['pack', '--out', archivePath], {
                cwd: workspace.directory,
                capture: true,
            });
            validatePackedIdentity(readPackedPackageJson(archivePath), packageEntry);
            const hashes = computeFileHashes(archivePath);
            createSbom({
                workspaceDirectory: workspace.directory,
                sbomPath,
                packageEntry,
                archive: { ...hashes, tarball },
                commit,
            });
            packageEvidence.push({
                name: packageEntry.name,
                version: packageEntry.version,
                role: packageEntry.role,
                tarball,
                sha256: hashes.sha256,
                sha512: hashes.sha512,
                sbom,
            });
        }

        fs.writeFileSync(
            path.join(outputDirectory, 'SHA256SUMS'),
            `${packageEvidence.map(({ sha256, tarball }) => `${sha256}  ${tarball}`).join('\n')}\n`,
        );
        fs.writeFileSync(
            path.join(outputDirectory, 'SHA512SUMS'),
            `${packageEvidence.map(({ sha512, tarball }) => `${sha512}  ${tarball}`).join('\n')}\n`,
        );
        const index = {
            schemaVersion: 1,
            publicationEnabled: false,
            commit,
            packages: packageEvidence,
        };
        fs.writeFileSync(
            path.join(outputDirectory, 'release-evidence.json'),
            `${JSON.stringify(index, null, 2)}\n`,
        );
        validateReleaseEvidenceIndex(index, outputDirectory);
        return index;
    } catch (error) {
        cleanFailureState(outputDirectory, outputCreated);
        throw error;
    }
}

const main = () => {
    const arguments_ = parseArguments(process.argv.slice(2));
    const index = generateReleaseEvidence(arguments_);
    console.log(
        `Generated source-candidate release evidence for ${index.packages.length} packages at commit ${index.commit}.`,
    );
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    try {
        main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
