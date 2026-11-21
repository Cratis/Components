// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    checkCompatibilityManifest,
    createCompatibilityManifest,
    discoverWorkspaceManifestPaths,
    serializeCompatibilityManifest,
    validateCompatibilityManifest,
} from './generate-compat-manifest.mjs';
import { prepareReleaseVersion } from './prepare-release-version.mjs';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);

const createManifest = () => createCompatibilityManifest(repositoryDirectory);

test('release preparation bumps all public workspaces and regenerates every bundled copy before publication', () => {
    const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'cratis-release-preparation-'));
    const workspaceDirectories = [
        'Source', 'ESLint', 'Migrator', 'Conformance', 'Adapters/Mui',
        'Adapters/PrimeReact', 'Adapters/PrimeReact10', 'Adapters/Designsystemet', 'Storybook',
    ];
    try {
        copyFileSync(path.join(repositoryDirectory, 'package.json'), path.join(temporaryRoot, 'package.json'));
        mkdirSync(path.join(temporaryRoot, 'scripts'), { recursive: true });
        copyFileSync(path.join(repositoryDirectory, 'scripts/renderer-adapter-matrix.json'), path.join(temporaryRoot, 'scripts/renderer-adapter-matrix.json'));
        for (const directory of workspaceDirectories) {
            mkdirSync(path.join(temporaryRoot, directory), { recursive: true });
            copyFileSync(path.join(repositoryDirectory, directory, 'package.json'), path.join(temporaryRoot, directory, 'package.json'));
        }
        mkdirSync(path.join(temporaryRoot, 'Conformance/for_plain_dom_renderer'));

        prepareReleaseVersion(temporaryRoot, '4.99.0');
        const expected = serializeCompatibilityManifest(createCompatibilityManifest(temporaryRoot));
        for (const relativePath of ['compat-manifest.json', 'Source/compat-manifest.json', 'Migrator/compat-manifest.json']) {
            assert.equal(readFileSync(path.join(temporaryRoot, relativePath), 'utf8'), expected);
        }
        const manifest = JSON.parse(expected);
        assert.equal(manifest.packages.length, 8);
        for (const entry of manifest.packages) {
            assert.equal(entry.version, '4.99.0');
        }
        const migrator = JSON.parse(readFileSync(path.join(temporaryRoot, 'Migrator/package.json'), 'utf8'));
        assert.equal(migrator.version, '4.99.0');
        assert.equal(manifest.packages.find(({ name }) => name === migrator.name).version, migrator.version);
        const adapter = JSON.parse(readFileSync(path.join(temporaryRoot, 'Adapters/Mui/package.json'), 'utf8'));
        assert.equal(adapter.devDependencies['@cratis/components'], '4.99.0');
        assert.equal(adapter.devDependencies['@cratis/components.conformance'], '4.99.0');

        writeFileSync(path.join(temporaryRoot, 'Migrator/compat-manifest.json'), 'stale\n');
        assert.throws(() => checkCompatibilityManifest(temporaryRoot), /Migrator\/compat-manifest.json is stale/u);
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true });
    }
});

for (const version of [undefined, 'not-a-version', 'v4.99.0']) {
    test(`release preparation rejects ${version ?? 'a missing version'} without changing manifests`, () => {
        const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'cratis-release-invalid-version-'));
        const original = '{"name":"@cratis/components","version":"4.0.0","dependencies":{"@cratis/components.migrator":"4.0.0"}}\n';
        try {
            mkdirSync(path.join(temporaryRoot, 'Source'));
            writeFileSync(path.join(temporaryRoot, 'package.json'), JSON.stringify({ workspaces: ['Source'] }));
            writeFileSync(path.join(temporaryRoot, 'Source/package.json'), original);
            assert.throws(
                () => prepareReleaseVersion(temporaryRoot, version),
                /release version must be a valid exact semantic version/i,
            );
            assert.equal(readFileSync(path.join(temporaryRoot, 'Source/package.json'), 'utf8'), original);
        } finally {
            rmSync(temporaryRoot, { recursive: true, force: true });
        }
    });
}

test('generated compatibility copies are deterministic and byte-identical', () => {
    const serialized = serializeCompatibilityManifest(createManifest());
    for (const relativePath of [
        'compat-manifest.json',
        'Source/compat-manifest.json',
        'Migrator/compat-manifest.json',
    ]) {
        assert.equal(
            readFileSync(path.join(repositoryDirectory, relativePath), 'utf8'),
            serialized,
        );
    }
});

test('all public package versions move together within the repository release', () => {
    const manifest = createManifest();
    for (const packageEntry of manifest.packages) {
        packageEntry.version = '4.99.0';
    }
    assert.doesNotThrow(() =>
        validateCompatibilityManifest(manifest, { rootDirectory: repositoryDirectory }),
    );

    const adapter = manifest.packages.find(
        ({ name }) => name === '@cratis/components.mui',
    );
    adapter.version = '4.98.0';
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /must match the repository release version/,
    );
});

test('a public package cannot opt out of repository-wide versioning', () => {
    const manifest = createManifest();
    const adapter = manifest.packages.find(
        ({ name }) => name === '@cratis/components.mui',
    );
    adapter.independentRelease = true;
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /must participate in repository-wide versioning/,
    );
});

test('the shared repository release stays inside the Components major range', () => {
    const manifest = createManifest();
    for (const packageEntry of manifest.packages) {
        packageEntry.version = '5.0.0';
    }
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /outside supported release range/,
    );
});

test('publication authorization is explicit and reversible', () => {
    const manifest = createManifest();
    assert.equal(manifest.publicationEnabled, true);
    assert.equal(manifest.releaseStatus, 'publication-authorized');
    assert.doesNotThrow(() =>
        validateCompatibilityManifest(manifest, { rootDirectory: repositoryDirectory }),
    );

    manifest.releaseStatus = 'source-candidate';
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /publication-authorized/,
    );

    manifest.publicationEnabled = false;
    assert.doesNotThrow(() =>
        validateCompatibilityManifest(manifest, { rootDirectory: repositoryDirectory }),
    );
});

for (const { label, location, keys, message } of [
    {
        label: 'tooling compatibility',
        location: ['toolingCompatibility'],
        keys: ['componentsCore', 'eslint', 'migrator'],
        message: 'Core 4 tooling compatibility must remain bounded to >=4 <5.',
    },
    {
        label: 'maintenance support window',
        location: ['supportWindows', 'components3'],
        keys: ['components', 'status', 'migrationTarget', 'tooling', 'ownerDecisionPolicy'],
        message: 'The Components 3 maintenance and migration support window is incomplete.',
    },
    {
        label: 'current support window',
        location: ['supportWindows', 'components4'],
        keys: ['components', 'status', 'rendererAbi', 'coreProfile', 'adapterProfile'],
        message: 'The Components 4 compatibility window is incomplete.',
    },
    {
        label: 'current tooling support window',
        location: ['supportWindows', 'components4', 'tooling'],
        keys: ['eslint', 'migrator'],
        message: 'The Components 4 compatibility window is incomplete.',
    },
]) {
    for (const key of keys) {
        test(`${label} rejects an invalid ${key} with its original message`, () => {
            const manifest = createManifest();
            const target = location.reduce((value, key) => value[key], manifest);
            target[key] = 'unsupported';
            assert.throws(
                () => validateCompatibilityManifest(manifest, { rootDirectory: undefined }),
                { message },
            );
        });
    }
}

for (const [field, value, message] of [
    ['schemaVersion', 0, 'Unsupported compatibility manifest schema.'],
    ['publicationEnabled', 'true', 'publicationEnabled must be a boolean.'],
    ['releaseStatus', 'unsupported', "Publication requires releaseStatus 'publication-authorized'."],
]) {
    test(`manifest metadata rejects an invalid ${field} with its original message`, () => {
        const manifest = createManifest();
        manifest[field] = value;
        assert.throws(
            () => validateCompatibilityManifest(manifest, { rootDirectory: undefined }),
            { message },
        );
    });
}

for (const [field, value, detail] of [
    ['role', 'unsupported', 'has invalid role or release-major policy metadata.'],
    ['releaseMajorRange', '>=3 <4', 'has invalid role or release-major policy metadata.'],
    ['version', 'not-a-version', 'must declare a valid exact current version.'],
    ['private', true, 'must remain explicitly public-intent.'],
    ['packageAccess', 'restricted', 'must remain explicitly public-intent.'],
    ['independentRelease', true, 'must participate in repository-wide versioning and must not declare cratisIndependentVersion.'],
]) {
    test(`package metadata rejects an invalid ${field} with its original message`, () => {
        const manifest = createManifest();
        manifest.packages[0][field] = value;
        assert.throws(
            () => validateCompatibilityManifest(manifest, { rootDirectory: undefined }),
            { message: `${manifest.packages[0].name} ${detail}` },
        );
    });
}

test('manifest validation reports earlier policy failures before later ones', () => {
    const manifest = createManifest();
    manifest.toolingCompatibility = {};
    manifest.supportWindows = {};
    manifest.gaScope.privateEvidence = [];
    assert.throws(
        () => validateCompatibilityManifest(manifest, { rootDirectory: undefined }),
        { message: 'Core 4 tooling compatibility must remain bounded to >=4 <5.' },
    );
});

test('private evidence remains unpublished and present in the source repository', () => {
    const manifest = createManifest();
    manifest.gaScope.privateEvidence[0].published = true;
    assert.throws(
        () => validateCompatibilityManifest(manifest),
        { message: "Private evidence 'plain' cannot be published." },
    );
    manifest.gaScope.privateEvidence[0].published = false;
    assert.throws(
        () => validateCompatibilityManifest(manifest, {
            rootDirectory: path.join(repositoryDirectory, 'package.json'),
        }),
        { message: "Private evidence 'plain' is missing from the source repository." },
    );
});

test('upstream ranges must exactly match package peers', () => {
    const manifest = createManifest();
    const adapter = manifest.packages.find(({ name }) => name === '@cratis/components.mui');
    adapter.peerDependencies['@mui/material'] = '*';
    assert.throws(
        () => validateCompatibilityManifest(manifest),
        { message: "@cratis/components.mui upstream '@mui/material' must exactly match its peer range." },
    );
});

test('workspace discovery sorts direct and wildcard manifests and skips non-workspaces', () => {
    const fixtureDirectory = path.join(repositoryDirectory, '.ai-work/506-b6');
    mkdirSync(fixtureDirectory, { recursive: true });
    const root = mkdtempSync(path.join(fixtureDirectory, 'workspace-discovery-'));
    try {
        for (const directory of ['Adapters/Zeta', 'Adapters/Alpha', 'Adapters/Empty']) {
            mkdirSync(path.join(root, directory), { recursive: true });
        }
        writeFileSync(path.join(root, 'Adapters/Zeta/package.json'), '{}');
        writeFileSync(path.join(root, 'Adapters/Alpha/package.json'), '{}');
        writeFileSync(path.join(root, 'Adapters/not-a-directory'), '{}');
        assert.deepEqual(discoverWorkspaceManifestPaths(['Source', 'Adapters/*', 'Missing'], root), [
            'Adapters/Alpha/package.json',
            'Adapters/Zeta/package.json',
            'Missing/package.json',
            'Source/package.json',
        ]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('adapter proof cannot drift from the renderer matrix', () => {
    const manifest = createManifest();
    const mui = manifest.packages.find(({ name }) => name === '@cratis/components.mui');
    mui.verifiedPeers.minimum['@emotion/react'] = '11.6.0';
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /verified peers must be copied/,
    );
});
