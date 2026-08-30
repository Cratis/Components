// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import semver from 'semver';
import { createFixture, validateMatrix } from './lib/renderer-adapter-matrix.mjs';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);
const outputPaths = [
    'compat-manifest.json',
    'Source/compat-manifest.json',
    'Migrator/compat-manifest.json',
];
const packagePolicies = new Map([
    ['@cratis/components', { role: 'core', range: '>=4 <5' }],
    ['@cratis/eslint-plugin-components', { role: 'eslint', range: '>=4 <5' }],
    ['@cratis/components.migrator', { role: 'migrator', range: '>=4 <5' }],
    ['@cratis/components.conformance', { role: 'conformance', range: '>=4 <5' }],
    ['@cratis/components.mui', { role: 'renderer-adapter', range: '>=4 <5' }],
    ['@cratis/components.primereact', { role: 'renderer-adapter', range: '>=4 <5' }],
    ['@cratis/components.primereact10', { role: 'renderer-adapter', range: '>=4 <5' }],
]);
const packageOrder = [...packagePolicies.keys()];
const privateEvidence = [
    {
        id: 'plain',
        sourcePath: 'Conformance/for_plain_dom_renderer',
        name: 'Plain DOM renderer conformance falsification fixture',
        purpose: 'private-conformance-evidence',
    },
    {
        id: 'storybook',
        sourcePath: 'Storybook',
        name: 'Composed renderer Storybook',
        purpose: 'private-renderer-evidence',
    },
];
const adapterKeysByPackage = new Map([
    ['@cratis/components.mui', 'mui'],
    ['@cratis/components.primereact', 'primereact11'],
    ['@cratis/components.primereact10', 'primereact10'],
]);

export function createCompatibilityManifest(rootDirectory = repositoryDirectory) {
    const rootPackage = readJson(path.join(rootDirectory, 'package.json'), rootDirectory);
    const workspaceManifestPaths = discoverWorkspaceManifestPaths(
        rootPackage.workspaces,
        rootDirectory,
    );
    const workspaceManifests = workspaceManifestPaths.map((manifestPath) => ({
        manifestPath,
        packageJson: readJson(path.join(rootDirectory, manifestPath), rootDirectory),
    }));
    const publicPackages = workspaceManifests
        .filter(({ packageJson }) => packageJson.private !== true)
        .map(({ packageJson }) => packageEntry(packageJson));
    validatePackageSet(publicPackages);
    publicPackages.sort(
        (left, right) =>
            packageOrder.indexOf(left.name) - packageOrder.indexOf(right.name),
    );

    const matrix = readJson(
        path.join(rootDirectory, 'scripts/renderer-adapter-matrix.json'),
        rootDirectory,
    );
    const manifestsByName = Object.fromEntries(
        workspaceManifests.map(({ packageJson }) => [packageJson.name, packageJson]),
    );
    validateMatrix(matrix, manifestsByName);

    for (const entry of publicPackages) {
        const adapterKey = adapterKeysByPackage.get(entry.name);
        if (!adapterKey) continue;
        entry.verifiedPeers = {
            minimum: sortObject(createFixture(matrix, adapterKey, 'minimum').peers),
            current: sortObject(createFixture(matrix, adapterKey, 'current').peers),
        };
    }

    const manifest = {
        schemaVersion: 2,
        releaseStatus: 'source-candidate',
        publicationEnabled: false,
        gaScope: {
            publicPackages: [...packageOrder],
            privateEvidence: privateEvidence.map(({ id, name, purpose }) => ({
                id,
                name,
                purpose,
                private: true,
                published: false,
            })),
        },
        toolingCompatibility: {
            componentsCore: '>=4 <5',
            eslint: '>=4 <5',
            migrator: '>=4 <5',
        },
        supportWindows: {
            components3: {
                components: '>=3 <4',
                status: 'maintenance-security-critical',
                migrationRole: 'source',
                migrationTarget: '>=4 <5',
                tooling: '>=4 <5',
                eolAt: null,
                eolApprovedByOwners: false,
                ownerDecisionPolicy:
                    'Set and approve EOL no later than 12 months after Components 4 GA.',
            },
            components4: {
                components: '>=4 <5',
                status: 'current-candidate',
                migrationRole: 'target',
                rendererAbi: 1,
                coreProfile: 'core/v1',
                adapterProfile: 'stable-presentation/v1',
                tooling: {
                    eslint: '>=4 <5',
                    migrator: '>=4 <5',
                },
                adapters: {
                    '@cratis/components.conformance': '>=4 <5',
                    '@cratis/components.mui': '>=4 <5',
                    '@cratis/components.primereact': '>=4 <5',
                    '@cratis/components.primereact10': '>=4 <5',
                },
            },
        },
        packages: publicPackages,
    };

    validateCompatibilityManifest(manifest, { rootDirectory, matrix });
    return manifest;
}

export function validateCompatibilityManifest(
    manifest,
    { rootDirectory = repositoryDirectory, matrix } = {},
) {
    if (manifest.schemaVersion !== 2) fail('Unsupported compatibility manifest schema.');
    if (typeof manifest.publicationEnabled !== 'boolean') {
        fail('publicationEnabled must be a boolean.');
    }
    if (manifest.releaseStatus !== 'source-candidate' && !manifest.publicationEnabled) {
        fail(
            "A non-publishing source manifest must have releaseStatus 'source-candidate'.",
        );
    }

    const scopedPackages = manifest.gaScope?.publicPackages ?? [];
    if (JSON.stringify(scopedPackages) !== JSON.stringify(packageOrder)) {
        fail(
            'gaScope.publicPackages must list the exact seven public packages in release order.',
        );
    }
    if ((manifest.packages ?? []).length !== packageOrder.length) {
        fail(`Expected ${packageOrder.length} public package entries.`);
    }

    const repositoryVersion = (manifest.packages ?? []).find(
        ({ name }) => name === '@cratis/components',
    )?.version;
    if (!repositoryVersion) fail('Core package version is missing.');

    for (const entry of manifest.packages ?? []) {
        const policy = packagePolicies.get(entry.name);
        if (!policy) fail(`Unexpected public package '${entry.name}'.`);
        if (entry.role !== policy.role || entry.releaseMajorRange !== policy.range) {
            fail(`${entry.name} has invalid role or release-major policy metadata.`);
        }
        if (semver.valid(entry.version) !== entry.version) {
            fail(`${entry.name} must declare a valid exact current version.`);
        }
        if (!semver.satisfies(entry.version, policy.range)) {
            fail(
                `${entry.name}@${entry.version} is outside supported release range '${policy.range}'.`,
            );
        }
        if (entry.private || entry.packageAccess !== 'public') {
            fail(`${entry.name} must remain explicitly public-intent.`);
        }
        if (entry.version !== repositoryVersion) {
            fail(
                `${entry.name}@${entry.version} must match the repository release version ${repositoryVersion}.`,
            );
        }
        if (entry.independentRelease !== false) {
            fail(
                `${entry.name} must participate in repository-wide versioning and must not declare cratisIndependentVersion.`,
            );
        }
        for (const [upstreamName, upstreamRange] of Object.entries(
            entry.upstream ?? {},
        )) {
            if (entry.peerDependencies?.[upstreamName] !== upstreamRange) {
                fail(
                    `${entry.name} upstream '${upstreamName}' must exactly match its peer range.`,
                );
            }
        }
    }

    const tooling = manifest.toolingCompatibility ?? {};
    if (
        tooling.componentsCore !== '>=4 <5' ||
        tooling.eslint !== '>=4 <5' ||
        tooling.migrator !== '>=4 <5'
    ) {
        fail('Core 4 tooling compatibility must remain bounded to >=4 <5.');
    }

    const components3 = manifest.supportWindows?.components3;
    const components4 = manifest.supportWindows?.components4;
    if (
        components3?.components !== '>=3 <4' ||
        components3?.status !== 'maintenance-security-critical' ||
        components3?.migrationTarget !== '>=4 <5' ||
        components3?.tooling !== '>=4 <5' ||
        !components3.ownerDecisionPolicy?.includes('12 months after Components 4 GA')
    ) {
        fail('The Components 3 maintenance and migration support window is incomplete.');
    }
    if (
        components4?.components !== '>=4 <5' ||
        components4?.status !== 'current-candidate' ||
        components4?.rendererAbi !== 1 ||
        components4?.coreProfile !== 'core/v1' ||
        components4?.adapterProfile !== 'stable-presentation/v1' ||
        components4?.tooling?.eslint !== '>=4 <5' ||
        components4?.tooling?.migrator !== '>=4 <5'
    ) {
        fail('The Components 4 candidate compatibility window is incomplete.');
    }
    const expectedAdapterRanges = Object.fromEntries(
        packageOrder
            .filter((name) =>
                ['conformance', 'renderer-adapter'].includes(
                    packagePolicies.get(name).role,
                ),
            )
            .map((name) => [name, packagePolicies.get(name).range]),
    );
    if (JSON.stringify(components4?.adapters) !== JSON.stringify(expectedAdapterRanges)) {
        fail('Components 4 must list the exact Conformance and adapter release ranges.');
    }

    const evidence = manifest.gaScope?.privateEvidence ?? [];
    if (
        JSON.stringify(evidence.map(({ id }) => id)) !==
        JSON.stringify(['plain', 'storybook'])
    ) {
        fail('gaScope.privateEvidence must list Plain and Storybook evidence.');
    }
    for (const item of evidence) {
        if (!item.private || item.published)
            fail(`Private evidence '${item.id}' cannot be published.`);
        const source = privateEvidence.find(({ id }) => id === item.id);
        if (
            rootDirectory &&
            source &&
            !fs.existsSync(path.join(rootDirectory, source.sourcePath))
        ) {
            fail(`Private evidence '${item.id}' is missing from the source repository.`);
        }
    }

    const activeMatrix =
        matrix ??
        (rootDirectory
            ? readJson(
                  path.join(rootDirectory, 'scripts/renderer-adapter-matrix.json'),
                  rootDirectory,
              )
            : undefined);
    if (activeMatrix) {
        for (const entry of manifest.packages ?? []) {
            const adapterKey = adapterKeysByPackage.get(entry.name);
            if (!adapterKey) continue;
            const expected = {
                minimum: sortObject(
                    createFixture(activeMatrix, adapterKey, 'minimum').peers,
                ),
                current: sortObject(
                    createFixture(activeMatrix, adapterKey, 'current').peers,
                ),
            };
            if (JSON.stringify(entry.verifiedPeers) !== JSON.stringify(expected)) {
                fail(
                    `${entry.name} verified peers must be copied from renderer-adapter-matrix.json.`,
                );
            }
        }
    }

    if (manifest.publicationEnabled) {
        if (manifest.releaseStatus !== 'publication-authorized') {
            fail("Publication requires releaseStatus 'publication-authorized'.");
        }
        if (!isIsoDate(components3?.eolAt) || components3?.eolApprovedByOwners !== true) {
            fail('Publication requires a valid owner-approved Components 3 eolAt date.');
        }
    }
}

export function serializeCompatibilityManifest(manifest) {
    return `${JSON.stringify(manifest, null, 4)}\n`;
}

function packageEntry(packageJson) {
    const policy = packagePolicies.get(packageJson.name);
    if (!policy)
        fail(`Unexpected public workspace package '${packageJson.name ?? '<unnamed>'}'.`);
    const entry = {
        name: packageJson.name,
        role: policy.role,
        version: packageJson.version,
        releaseMajorRange: policy.range,
        independentRelease: packageJson.cratisIndependentVersion === true,
        private: packageJson.private === true,
        packageAccess: packageJson.publishConfig?.access ?? null,
        peerDependencies: sortObject(packageJson.peerDependencies ?? {}),
        upstream: sortObject(packageJson.cratis?.upstream ?? {}),
    };
    const abi = packageJson.cratisUiAbi ?? parseAbiMajor(packageJson.cratis?.abi);
    if (abi !== undefined) entry.rendererAbi = abi;
    if (packageJson.cratis?.profile) entry.rendererProfile = packageJson.cratis.profile;
    return entry;
}

function validatePackageSet(packages) {
    const actualNames = packages.map(({ name }) => name);
    const missing = packageOrder.filter((name) => !actualNames.includes(name));
    const unexpected = actualNames.filter((name) => !packagePolicies.has(name));
    const duplicates = actualNames.filter(
        (name, index) => actualNames.indexOf(name) !== index,
    );
    if (missing.length > 0) fail(`Missing release packages: ${missing.join(', ')}.`);
    if (unexpected.length > 0)
        fail(`Unexpected release packages: ${unexpected.join(', ')}.`);
    if (duplicates.length > 0)
        fail(`Duplicate release packages: ${[...new Set(duplicates)].join(', ')}.`);
    if (actualNames.length !== packageOrder.length) {
        fail(
            `Expected ${packageOrder.length} release packages, found ${actualNames.length}.`,
        );
    }
}

function discoverWorkspaceManifestPaths(workspaces, rootDirectory) {
    if (!Array.isArray(workspaces))
        fail('Root package.json must declare a workspaces array.');
    const manifestPaths = [];
    for (const workspace of workspaces) {
        if (workspace.endsWith('/*')) {
            const parent = path.join(rootDirectory, workspace.slice(0, -2));
            for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
                if (!entry.isDirectory()) continue;
                const relativeManifest = path.posix.join(
                    workspace.slice(0, -2),
                    entry.name,
                    'package.json',
                );
                if (fs.existsSync(path.join(rootDirectory, relativeManifest))) {
                    manifestPaths.push(relativeManifest);
                }
            }
        } else {
            manifestPaths.push(path.posix.join(workspace, 'package.json'));
        }
    }
    return manifestPaths.sort();
}

function isIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
    return new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
}

function parseAbiMajor(value) {
    if (value === undefined) return undefined;
    const match = String(value).match(/\d+/u);
    return match ? Number(match[0]) : undefined;
}

function sortObject(value) {
    return Object.fromEntries(
        Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
    );
}

function readJson(filePath, rootDirectory) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        fail(
            `Could not parse ${path.relative(rootDirectory, filePath)}: ${error instanceof Error ? error.message : String(error)}.`,
        );
    }
}

function fail(message) {
    throw new Error(message);
}

async function main() {
    const mode = process.argv[2] ?? '--check';
    if (!['--check', '--write'].includes(mode)) {
        throw new Error(
            'Usage: node scripts/generate-compat-manifest.mjs [--check|--write]',
        );
    }
    const serialized = serializeCompatibilityManifest(createCompatibilityManifest());
    if (mode === '--write') {
        for (const relativePath of outputPaths) {
            fs.writeFileSync(path.join(repositoryDirectory, relativePath), serialized);
        }
        console.log(
            `Wrote ${outputPaths.join(', ')} from the seven public workspace manifests.`,
        );
        return;
    }
    for (const relativePath of outputPaths) {
        const outputPath = path.join(repositoryDirectory, relativePath);
        if (!fs.existsSync(outputPath)) {
            throw new Error(
                `${relativePath} is missing. Run yarn generate-compat-manifest.`,
            );
        }
        if (fs.readFileSync(outputPath, 'utf8') !== serialized) {
            throw new Error(
                `${relativePath} is stale. Run yarn generate-compat-manifest and review it.`,
            );
        }
    }
    console.log(
        `Verified deterministic compatibility metadata in ${outputPaths.join(', ')}.`,
    );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
