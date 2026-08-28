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
        'Codemods/compat-manifest.json',
    ]) {
        assert.equal(
            readFileSync(path.join(repositoryDirectory, relativePath), 'utf8'),
            serialized,
        );
    }
});

test('package versions are range-validated instead of snapshot-pinned', () => {
    const manifest = createManifest();
    const core = manifest.packages.find(({ name }) => name === '@cratis/components');
    core.version = '4.99.0';
    assert.doesNotThrow(() =>
        validateCompatibilityManifest(manifest, { rootDirectory: repositoryDirectory }),
    );

    core.version = '5.0.0';
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /outside supported release range/,
    );
});

test('publication remains closed until status and Components 3 EOL are owner-approved', () => {
    const manifest = createManifest();
    manifest.publicationEnabled = true;
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /publication-authorized/,
    );

    manifest.releaseStatus = 'publication-authorized';
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /owner-approved Components 3 eolAt/,
    );

    manifest.supportWindows.components3.eolAt = '2028-01-31';
    manifest.supportWindows.components3.eolApprovedByOwners = true;
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
