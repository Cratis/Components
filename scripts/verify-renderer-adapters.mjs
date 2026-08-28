// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    createFixture,
    readJson,
    validateMatrix,
    yarnPackageExtensions,
} from './lib/renderer-adapter-matrix.mjs';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);
const matrixPath = path.join(repositoryDirectory, 'scripts/renderer-adapter-matrix.json');
const matrix = readJson(matrixPath);
const managers = ['npm', 'pnpm', 'yarn-pnp'];
const boundaries = ['minimum', 'current'];

const parseArguments = (argv) => {
    const options = {};
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (!argument.startsWith('--'))
            throw new Error(`Unexpected argument '${argument}'.`);
        const name = argument.slice(2);
        const value = argv[index + 1];
        if (!value || value.startsWith('--'))
            throw new Error(`Missing value for --${name}.`);
        options[name] = value;
        index += 1;
    }
    return options;
};

const sourceManifests = () => {
    const manifests = {};
    const core = readJson(path.join(repositoryDirectory, 'Source/package.json'));
    manifests[core.name] = core;
    for (const adapter of Object.values(matrix.adapters)) {
        const manifest = readJson(
            path.join(repositoryDirectory, adapter.directory, 'package.json'),
        );
        manifests[manifest.name] = manifest;
    }
    return manifests;
};

const run = (command, args, cwd = repositoryDirectory, capture = false) => {
    const result = spawnSync(command, args, {
        cwd,
        encoding: capture ? 'utf8' : undefined,
        stdio: capture ? 'pipe' : 'inherit',
        maxBuffer: 16 * 1024 * 1024,
    });
    if (capture) {
        if (result.stdout) process.stdout.write(result.stdout);
        if (result.stderr) process.stderr.write(result.stderr);
    }
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(
            `${command} ${args.join(' ')} failed with exit code ${result.status}.`,
        );
    }
    return capture ? `${result.stdout ?? ''}\n${result.stderr ?? ''}` : '';
};

const unpackManifest = (archive, destination) => {
    mkdirSync(destination);
    run('tar', ['-xzf', archive, '-C', destination]);
    return readJson(path.join(destination, 'package/package.json'));
};

const quoteYaml = (value) => JSON.stringify(value);

const writeYarnConfiguration = (consumerDirectory, extensions) => {
    const lines = [
        'nodeLinker: pnp',
        '# Narrow corrections for confirmed upstream manifests; no peer range is relaxed.',
        'packageExtensions:',
    ];
    for (const [selector, extension] of Object.entries(extensions)) {
        lines.push(`  ${quoteYaml(selector)}:`, '    dependencies:');
        for (const [name, version] of Object.entries(extension.dependencies)) {
            lines.push(`      ${quoteYaml(name)}: ${quoteYaml(version)}`);
        }
    }
    writeFileSync(path.join(consumerDirectory, '.yarnrc.yml'), `${lines.join('\n')}\n`);
};

const writeProbe = (consumerDirectory, adapterManifest, fixture) => {
    const upstreamVersions = Object.fromEntries(
        Object.keys(adapterManifest.cratis.upstream).map((name) => [
            name,
            fixture.peers[name],
        ]),
    );
    const probe = `
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageName = ${JSON.stringify(adapterManifest.name)};
const manifestExport = ${JSON.stringify(fixture.adapter.manifestExport)};
const rendererId = ${JSON.stringify(fixture.adapter.rendererId)};
const upstreamVersions = ${JSON.stringify(upstreamVersions, null, 4)};
const api = await import(packageName);
const publicNames = Object.keys(api).sort();
if (JSON.stringify(publicNames) !== JSON.stringify([manifestExport])) {
    throw new Error(\`\${packageName} exposes [\${publicNames.join(', ')}], expected only \${manifestExport}.\`);
}
if (api[manifestExport]?.id !== rendererId) {
    throw new Error(\`\${packageName} renderer id is \${api[manifestExport]?.id}, expected \${rendererId}.\`);
}

const installedPackageVersion = packageToResolve => {
    let directory = path.dirname(fileURLToPath(import.meta.resolve(packageToResolve)));
    while (true) {
        const candidate = path.join(directory, 'package.json');
        try {
            const manifest = JSON.parse(readFileSync(candidate, 'utf8'));
            if (manifest.name === packageToResolve) return manifest.version;
        } catch (error) {
            if (error?.code !== 'ENOENT') throw error;
        }
        const parent = path.dirname(directory);
        if (parent === directory) break;
        directory = parent;
    }
    throw new Error(\`Could not locate installed manifest for \${packageToResolve}.\`);
};

for (const [name, expectedVersion] of Object.entries(upstreamVersions)) {
    const actualVersion = installedPackageVersion(name);
    if (actualVersion !== expectedVersion) {
        throw new Error(\`Resolved \${name}@\${actualVersion}, expected boundary version \${expectedVersion}.\`);
    }
}
console.log(\`Verified \${packageName} \${rendererId} with exact boundary upstream versions.\`);
`;
    writeFileSync(path.join(consumerDirectory, 'verify.mjs'), probe.trimStart());
};

const peerWarningPatterns = {
    npm: [/ERESOLVE/iu, /overriding peer dependency/iu, /peer dep(?:endency)?/iu],
    pnpm: [/WARN[^\n]*peer/iu, /unmet peer/iu],
    'yarn-pnp': [/YN0002/iu, /YN0060/iu, /YN0086/iu],
};

const install = (manager, consumerDirectory, archives, fixture) => {
    const exactPeers = Object.entries(fixture.peers).map(
        ([name, version]) => `${name}@${version}`,
    );
    let output;
    if (manager === 'npm') {
        output = run(
            'npm',
            [
                'install',
                '--ignore-scripts',
                '--no-audit',
                '--no-fund',
                '--strict-peer-deps',
                ...archives,
                ...exactPeers,
            ],
            consumerDirectory,
            true,
        );
    } else if (manager === 'pnpm') {
        run('corepack', ['prepare', `pnpm@${matrix.packageManagers.pnpm}`, '--activate']);
        output = run(
            'pnpm',
            [
                'add',
                '--ignore-scripts',
                '--strict-peer-dependencies',
                ...archives,
                ...exactPeers,
            ],
            consumerDirectory,
            true,
        );
    } else {
        run('corepack', ['prepare', `yarn@${matrix.packageManagers.yarn}`, '--activate']);
        writeYarnConfiguration(consumerDirectory, yarnPackageExtensions(matrix, fixture));
        output = run(
            'yarn',
            ['add', ...archives, ...exactPeers],
            consumerDirectory,
            true,
        );
    }

    const peerWarning = peerWarningPatterns[manager].find((pattern) =>
        pattern.test(output),
    );
    if (peerWarning) {
        throw new Error(
            `${manager} reported strict peer-validation warning '${peerWarning}'.`,
        );
    }
};

const verifyFixture = (adapterKey, boundary, manager) => {
    const manifests = sourceManifests();
    validateMatrix(matrix, manifests);
    const fixture = createFixture(matrix, adapterKey, boundary);
    const temporary = mkdtempSync(path.join(tmpdir(), 'cratis-renderer-adapter-'));

    try {
        const coreArchive = path.join(temporary, 'components-core.tgz');
        const adapterArchive = path.join(temporary, 'components-adapter.tgz');
        run('yarn', ['workspace', '@cratis/components', 'prepare']);
        run('yarn', ['workspace', fixture.adapter.workspace, 'clean']);
        run('yarn', ['workspace', fixture.adapter.workspace, 'build']);
        run('yarn', ['workspace', '@cratis/components', 'pack', '--out', coreArchive]);
        run('yarn', [
            'workspace',
            fixture.adapter.workspace,
            'pack',
            '--out',
            adapterArchive,
        ]);

        const packedCore = unpackManifest(
            coreArchive,
            path.join(temporary, 'unpacked-core'),
        );
        const packedAdapter = unpackManifest(
            adapterArchive,
            path.join(temporary, 'unpacked-adapter'),
        );
        validateMatrix(matrix, {
            ...manifests,
            [packedCore.name]: packedCore,
            [packedAdapter.name]: packedAdapter,
        });

        const consumerDirectory = path.join(temporary, 'consumer');
        mkdirSync(consumerDirectory);
        writeFileSync(
            path.join(consumerDirectory, 'package.json'),
            '{"private":true,"type":"module"}\n',
        );
        writeProbe(consumerDirectory, packedAdapter, fixture);
        install(manager, consumerDirectory, [coreArchive, adapterArchive], fixture);
        run(
            manager === 'yarn-pnp' ? 'yarn' : 'node',
            manager === 'yarn-pnp' ? ['node', 'verify.mjs'] : ['verify.mjs'],
            consumerDirectory,
        );
        console.log(`Verified ${adapterKey}/${boundary}/${manager}.`);
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
};

const options = parseArguments(process.argv.slice(2));
const adapterSelection = options.adapter ?? 'all';
const boundarySelection = options.boundary ?? 'all';
const managerSelection = options.manager ?? 'npm';
const adapterKeys =
    adapterSelection === 'all' ? Object.keys(matrix.adapters) : [adapterSelection];
const selectedBoundaries = boundarySelection === 'all' ? boundaries : [boundarySelection];
const selectedManagers = managerSelection === 'all' ? managers : [managerSelection];

for (const adapterKey of adapterKeys) {
    if (!matrix.adapters[adapterKey])
        throw new Error(`Unknown renderer adapter '${adapterKey}'.`);
}
for (const boundary of selectedBoundaries) {
    if (!boundaries.includes(boundary))
        throw new Error(`Unknown boundary '${boundary}'.`);
}
for (const manager of selectedManagers) {
    if (!managers.includes(manager))
        throw new Error(`Unknown package manager '${manager}'.`);
}

for (const adapterKey of adapterKeys) {
    for (const boundary of selectedBoundaries) {
        for (const manager of selectedManagers)
            verifyFixture(adapterKey, boundary, manager);
    }
}
