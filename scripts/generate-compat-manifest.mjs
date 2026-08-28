// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);
const outputPath = path.join(repositoryDirectory, 'compat-manifest.json');
const expectedPackages = new Map([
    ['@cratis/components', 'core'],
    ['@cratis/eslint-plugin-components', 'eslint'],
    ['@cratis/components-codemods', 'codemods'],
    ['@cratis/components.conformance', 'conformance'],
    ['@cratis/components.mui', 'renderer-adapter'],
    ['@cratis/components.primereact', 'renderer-adapter'],
    ['@cratis/components.primereact10', 'renderer-adapter'],
]);
const packageOrder = [...expectedPackages.keys()];
const expectedVersions = new Map([
    ['@cratis/components', '4.0.0'],
    ['@cratis/eslint-plugin-components', '4.0.0'],
    ['@cratis/components-codemods', '4.0.0'],
    ['@cratis/components.conformance', '0.1.0'],
    ['@cratis/components.mui', '0.1.0'],
    ['@cratis/components.primereact', '0.1.0'],
    ['@cratis/components.primereact10', '0.1.0'],
]);
const rendererAbi = 1;
const coreTarget = '4.x';

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) {
    throw new Error('Usage: node scripts/generate-compat-manifest.mjs [--check|--write]');
}

const rootPackage = readJson(path.join(repositoryDirectory, 'package.json'));
const workspaceManifestPaths = discoverWorkspaceManifestPaths(rootPackage.workspaces);
const packages = workspaceManifestPaths
    .map((manifestPath) => packageEntry(manifestPath))
    .filter((entry) => entry !== undefined);
validatePackageSet(packages);

packages.sort(
    (left, right) => packageOrder.indexOf(left.name) - packageOrder.indexOf(right.name),
);

const manifest = {
    schemaVersion: 1,
    publicationEnabled: false,
    rendererAbi,
    coreTarget,
    sourcePackageManifests: packages.map((entry) => entry.manifest),
    packages,
    privateArtifacts: [
        {
            id: 'plain',
            path: 'Conformance/for_plain_dom_renderer',
            purpose: 'Private plain-DOM conformance falsification fixture',
            private: true,
            published: false,
        },
        {
            id: 'storybook',
            path: 'Storybook',
            purpose: 'Private composed renderer evidence',
            private: true,
            published: false,
            releaseBlocker: false,
        },
    ],
};

validateManifest(manifest);
const serialized = `${JSON.stringify(manifest, null, 4)}\n`;

if (mode === '--write') {
    fs.writeFileSync(outputPath, serialized);
    console.log(
        `Wrote ${path.relative(repositoryDirectory, outputPath)} from ${packages.length} workspace package manifests.`,
    );
} else {
    if (!fs.existsSync(outputPath)) {
        fail('compat-manifest.json is missing. Run yarn generate-compat-manifest.');
    }
    const current = fs.readFileSync(outputPath, 'utf8');
    if (current !== serialized) {
        fail(
            'compat-manifest.json is stale. Run yarn generate-compat-manifest and review the package metadata change.',
        );
    }
    console.log(
        `Verified compat-manifest.json against ${packages.length} workspace package manifests.`,
    );
}

function discoverWorkspaceManifestPaths(workspaces) {
    if (!Array.isArray(workspaces))
        fail('Root package.json must declare a workspaces array.');

    const manifestPaths = [];
    for (const workspace of workspaces) {
        if (workspace.endsWith('/*')) {
            const parent = path.join(repositoryDirectory, workspace.slice(0, -2));
            for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
                if (!entry.isDirectory()) continue;
                const relativeManifest = path.posix.join(
                    workspace.slice(0, -2),
                    entry.name,
                    'package.json',
                );
                if (fs.existsSync(path.join(repositoryDirectory, relativeManifest))) {
                    manifestPaths.push(relativeManifest);
                }
            }
        } else {
            manifestPaths.push(path.posix.join(workspace, 'package.json'));
        }
    }
    return manifestPaths.sort();
}

function packageEntry(manifestPath) {
    const packageJson = readJson(path.join(repositoryDirectory, manifestPath));
    if (!expectedPackages.has(packageJson.name)) {
        if (packageJson.private === true) return undefined;
        fail(
            `Workspace ${manifestPath} declares unexpected public package '${packageJson.name ?? '<unnamed>'}'.`,
        );
    }

    const entry = {
        name: packageJson.name,
        manifest: manifestPath,
        role: expectedPackages.get(packageJson.name),
        version: packageJson.version,
        private: packageJson.private === true,
        packageAccess: packageJson.publishConfig?.access ?? null,
        peerDependencies: sortObject(packageJson.peerDependencies ?? {}),
        upstream: sortObject(packageJson.cratis?.upstream ?? {}),
    };

    const abi = packageJson.cratisUiAbi ?? parseAbiMajor(packageJson.cratis?.abi);
    if (abi !== undefined) entry.rendererAbi = abi;
    return entry;
}

function validatePackageSet(packages) {
    const actualNames = packages.map((entry) => entry.name);
    const missing = packageOrder.filter((name) => !actualNames.includes(name));
    const duplicates = actualNames.filter(
        (name, index) => actualNames.indexOf(name) !== index,
    );
    if (missing.length > 0) fail(`Missing release packages: ${missing.join(', ')}.`);
    if (duplicates.length > 0)
        fail(`Duplicate release packages: ${[...new Set(duplicates)].join(', ')}.`);
    if (actualNames.length !== packageOrder.length) {
        fail(
            `Expected ${packageOrder.length} release packages, found ${actualNames.length}.`,
        );
    }
}

function validateManifest(manifest) {
    if (manifest.rendererAbi !== 1 || manifest.coreTarget !== '4.x') {
        fail(
            'Compatibility metadata must target renderer ABI 1 and Components Core 4.x.',
        );
    }
    if (manifest.publicationEnabled !== false) {
        fail('Compatibility metadata must not enable publication.');
    }

    for (const entry of manifest.packages) {
        if (entry.private || entry.packageAccess !== 'public') {
            fail(
                `${entry.name} must remain an explicitly public-intent package manifest.`,
            );
        }
        if (entry.version !== expectedVersions.get(entry.name)) {
            fail(
                `${entry.name} must declare release version ${expectedVersions.get(entry.name)}; found ${entry.version}.`,
            );
        }
        if (
            entry.rendererAbi !== undefined &&
            entry.rendererAbi !== manifest.rendererAbi
        ) {
            fail(
                `${entry.name} declares renderer ABI ${entry.rendererAbi}; expected ${manifest.rendererAbi}.`,
            );
        }
        for (const [upstreamName, upstreamRange] of Object.entries(entry.upstream)) {
            if (entry.peerDependencies[upstreamName] !== upstreamRange) {
                fail(
                    `${entry.name} upstream '${upstreamName}' must exactly match its peer dependency range.`,
                );
            }
        }
    }

    const coreBoundPackages = manifest.packages.filter(
        (entry) =>
            entry.role === 'renderer-adapter' || entry.role === 'conformance',
    );
    for (const entry of coreBoundPackages) {
        if (entry.peerDependencies['@cratis/components'] !== '>=4 <5') {
            fail(`${entry.name} must declare the final @cratis/components >=4 <5 peer range.`);
        }
    }

    const primeReact10 = manifest.packages.find(
        (entry) => entry.name === '@cratis/components.primereact10',
    );
    if (
        primeReact10.peerDependencies.primereact !== '>=10.9.9 <11' ||
        primeReact10.upstream.primereact !== '>=10.9.9 <11'
    ) {
        fail(
            'PrimeReact 10 must remain bounded to >=10.9.9 <11 in peers and upstream metadata.',
        );
    }

    for (const artifact of manifest.privateArtifacts) {
        if (!artifact.private || artifact.published) {
            fail(
                `Private artifact '${artifact.id}' must be explicitly private and non-published.`,
            );
        }
        if (!fs.existsSync(path.join(repositoryDirectory, artifact.path))) {
            fail(
                `Private artifact '${artifact.id}' path '${artifact.path}' does not exist.`,
            );
        }
    }
}

function parseAbiMajor(value) {
    if (value === undefined) return undefined;
    const match = String(value).match(/\d+/);
    return match ? Number(match[0]) : undefined;
}

function sortObject(value) {
    return Object.fromEntries(
        Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
    );
}

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        fail(
            `Could not parse ${path.relative(repositoryDirectory, filePath)}: ${error instanceof Error ? error.message : String(error)}.`,
        );
    }
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
