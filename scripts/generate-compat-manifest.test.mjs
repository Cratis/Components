// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    createCompatibilityManifest,
    serializeCompatibilityManifest,
    validateCompatibilityManifest,
} from './generate-compat-manifest.mjs';

const repositoryDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
);

const createManifest = () => createCompatibilityManifest(repositoryDirectory);

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
