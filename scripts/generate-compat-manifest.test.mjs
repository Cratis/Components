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
        'Adapters/PrimeReact', 'Adapters/PrimeReact10', 'Storybook',
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
        assert.equal(manifest.packages.length, 7);
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
