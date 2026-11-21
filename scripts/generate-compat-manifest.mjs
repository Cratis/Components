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
    ['@cratis/components.designsystemet', { role: 'renderer-adapter', range: '>=4 <5' }],
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
    ['@cratis/components.designsystemet', 'designsystemet'],
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
        releaseStatus: 'publication-authorized',
        publicationEnabled: true,
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
                status: 'current',
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
                    '@cratis/components.designsystemet': '>=4 <5',
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
    validatePublicationMetadata(manifest);
    validatePublicPackageScope(manifest);

    validateRepositoryPackages(manifest.packages ?? []);
    validateToolingCompatibility(manifest.toolingCompatibility ?? {});
    validateMaintenanceWindow(manifest.supportWindows?.components3);
    validateCurrentWindow(manifest.supportWindows?.components4);
    validateAdapterRanges(manifest.supportWindows?.components4);
    validatePrivateEvidence(manifest.gaScope?.privateEvidence ?? [], rootDirectory);

    const activeMatrix =
        matrix ??
        (rootDirectory
            ? readJson(
                  path.join(rootDirectory, 'scripts/renderer-adapter-matrix.json'),
                  rootDirectory,
              )
            : undefined);
    if (activeMatrix) {
        validateVerifiedPeers(manifest.packages ?? [], activeMatrix);
    }

    if (
        manifest.publicationEnabled &&
        manifest.releaseStatus !== 'publication-authorized'
    ) {
        fail("Publication requires releaseStatus 'publication-authorized'.");
    }
}

function validatePublicationMetadata(manifest) {
    if (manifest.schemaVersion !== 2) fail('Unsupported compatibility manifest schema.');
    if (typeof manifest.publicationEnabled !== 'boolean') {
        fail('publicationEnabled must be a boolean.');
    }
    if (manifest.releaseStatus !== 'source-candidate' && !manifest.publicationEnabled) {
        fail(
            "A non-publishing source manifest must have releaseStatus 'source-candidate'.",
        );
    }
}

function validatePublicPackageScope(manifest) {
    const scopedPackages = manifest.gaScope?.publicPackages ?? [];
    if (JSON.stringify(scopedPackages) !== JSON.stringify(packageOrder)) {
        fail(
            'gaScope.publicPackages must list the exact eight public packages in release order.',
        );
    }
    if ((manifest.packages ?? []).length !== packageOrder.length) {
        fail(`Expected ${packageOrder.length} public package entries.`);
    }
}

function validateRepositoryPackages(packages) {
    const repositoryVersion = packages.find(
        ({ name }) => name === '@cratis/components',
    )?.version;
    if (!repositoryVersion) fail('Core package version is missing.');

    for (const entry of packages) {
        validatePublicPackage(entry, repositoryVersion);
    }
}

function validatePublicPackage(entry, repositoryVersion) {
    const policy = packagePolicies.get(entry.name);
    if (!policy) fail(`Unexpected public package '${entry.name}'.`);
    if (entry.role !== policy.role || entry.releaseMajorRange !== policy.range) {
        fail(`${entry.name} has invalid role or release-major policy metadata.`);
    }
    validatePackageVersion(entry, policy.range);
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
    validateUpstreamPeers(entry);
}

function validatePackageVersion(entry, range) {
    if (semver.valid(entry.version) !== entry.version) {
        fail(`${entry.name} must declare a valid exact current version.`);
    }
    if (!semver.satisfies(entry.version, range)) {
        fail(
            `${entry.name}@${entry.version} is outside supported release range '${range}'.`,
        );
    }
}

function validateUpstreamPeers(entry) {
    for (const [upstreamName, upstreamRange] of Object.entries(entry.upstream ?? {})) {
        if (entry.peerDependencies?.[upstreamName] !== upstreamRange) {
            fail(
                `${entry.name} upstream '${upstreamName}' must exactly match its peer range.`,
            );
        }
    }
}

function validateToolingCompatibility(tooling) {
    if (!hasProperties(tooling, {
        componentsCore: '>=4 <5',
        eslint: '>=4 <5',
        migrator: '>=4 <5',
    })) {
        fail('Core 4 tooling compatibility must remain bounded to >=4 <5.');
    }
}

function validateMaintenanceWindow(components3) {
    if (
        !hasProperties(components3, {
            components: '>=3 <4',
            status: 'maintenance-security-critical',
            migrationTarget: '>=4 <5',
            tooling: '>=4 <5',
        }) ||
        !components3.ownerDecisionPolicy?.includes('12 months after Components 4 GA')
    ) {
        fail('The Components 3 maintenance and migration support window is incomplete.');
    }
}

function validateCurrentWindow(components4) {
    if (
        !hasProperties(components4, {
            components: '>=4 <5',
            status: 'current',
            rendererAbi: 1,
            coreProfile: 'core/v1',
            adapterProfile: 'stable-presentation/v1',
        }) ||
        !hasProperties(components4?.tooling, { eslint: '>=4 <5', migrator: '>=4 <5' })
    ) {
        fail('The Components 4 compatibility window is incomplete.');
    }
}

function hasProperties(value, expected) {
    return Object.entries(expected).every(([key, required]) => value?.[key] === required);
}

function validateAdapterRanges(components4) {
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
}

function validatePrivateEvidence(evidence, rootDirectory) {
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
        if (rootDirectory && source) {
            validateEvidenceSource(rootDirectory, source, item.id);
        }
    }
}

function validateEvidenceSource(rootDirectory, source, id) {
    if (!fs.existsSync(path.join(rootDirectory, source.sourcePath))) {
        fail(`Private evidence '${id}' is missing from the source repository.`);
    }
}

function validateVerifiedPeers(packages, matrix) {
    for (const entry of packages) {
        const adapterKey = adapterKeysByPackage.get(entry.name);
        if (!adapterKey) continue;
        const expected = {
            minimum: sortObject(createFixture(matrix, adapterKey, 'minimum').peers),
            current: sortObject(createFixture(matrix, adapterKey, 'current').peers),
        };
        if (JSON.stringify(entry.verifiedPeers) !== JSON.stringify(expected)) {
            fail(
                `${entry.name} verified peers must be copied from renderer-adapter-matrix.json.`,
            );
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

export function discoverWorkspaceManifestPaths(workspaces, rootDirectory) {
    if (!Array.isArray(workspaces))
        fail('Root package.json must declare a workspaces array.');
    return workspaces.flatMap((workspace) =>
        workspace.endsWith('/*')
            ? discoverChildManifestPaths(workspace.slice(0, -2), rootDirectory)
            : [path.posix.join(workspace, 'package.json')],
    ).sort();
}

function discoverChildManifestPaths(workspace, rootDirectory) {
    const parent = path.join(rootDirectory, workspace);
    return fs.readdirSync(parent, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.posix.join(workspace, entry.name, 'package.json'))
        .filter((manifestPath) => fs.existsSync(path.join(rootDirectory, manifestPath)));
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

export function writeCompatibilityManifest(rootDirectory = repositoryDirectory) {
    const serialized = serializeCompatibilityManifest(
        createCompatibilityManifest(rootDirectory),
    );
    for (const relativePath of outputPaths) {
        fs.writeFileSync(path.join(rootDirectory, relativePath), serialized);
    }
    console.log(
        `Wrote ${outputPaths.join(', ')} from the eight public workspace manifests.`,
    );
}

export function checkCompatibilityManifest(rootDirectory = repositoryDirectory) {
    const serialized = serializeCompatibilityManifest(
        createCompatibilityManifest(rootDirectory),
    );
    for (const relativePath of outputPaths) {
        const outputPath = path.join(rootDirectory, relativePath);
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

async function main() {
    const mode = process.argv[2] ?? '--check';
    if (!['--check', '--write'].includes(mode)) {
        throw new Error(
            'Usage: node scripts/generate-compat-manifest.mjs [--check|--write]',
        );
    }
    if (mode === '--write') {
        writeCompatibilityManifest();
    } else {
        checkCompatibilityManifest();
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
