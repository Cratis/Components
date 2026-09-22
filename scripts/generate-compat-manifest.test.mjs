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

const historical4 = () => {
    const manifest = createManifest();
    manifest.toolingCompatibility = { componentsCore: '>=4 <5', eslint: '>=4 <5', migrator: '>=4 <5' };
    delete manifest.supportWindows.components5;
    manifest.supportWindows.components3.tooling = '>=4 <5';
    manifest.supportWindows.components4.status = 'current';
    manifest.supportWindows.components4.tooling.migrator = '>=4 <5';
    for (const entry of manifest.packages) {
        entry.version = '4.12.0';
        entry.releaseMajorRange = '>=4 <5';
        if (entry.peerDependencies['@cratis/components']) entry.peerDependencies['@cratis/components'] = '>=4 <5';
        for (const name of ['@cratis/arc', '@cratis/arc.react']) {
            if (entry.peerDependencies[name]) entry.peerDependencies[name] = '>=20.3.1 <23';
        }
    }
    return manifest;
};

for (const [line, create] of [[4, historical4], [5, createManifest]]) {
    test(`Components ${line} accepts its reviewed peer contract`, () => {
        const manifest = create();
        assert.equal(manifest.packages[0].releaseMajorRange, `>=${line} <${line + 1}`);
        assert.equal(manifest.packages[0].peerDependencies['@cratis/arc'], line === 4 ? '>=20.3.1 <23' : '>=22.19.1 <23');
        assert.doesNotThrow(() => validateCompatibilityManifest(manifest, { rootDirectory: null }));
    });
    test(`Components ${line} rejects the other line's Arc contract`, () => {
        const manifest = create();
        manifest.packages[0].peerDependencies['@cratis/arc'] = line === 4 ? '>=22.19.1 <23' : '>=20.3.1 <23';
        assert.throws(() => validateCompatibilityManifest(manifest, { rootDirectory: null }), /peer contract/);
    });
    test(`Components ${line} rejects mixed adapter/Core families`, () => {
        const manifest = create();
        manifest.packages.find(({ role }) => role === 'renderer-adapter').peerDependencies['@cratis/components'] = line === 4 ? '>=5 <6' : '>=4 <5';
        assert.throws(() => validateCompatibilityManifest(manifest, { rootDirectory: null }), /matching Components peer family/);
    });
}

test('5.0.0 is accepted without changing renderer ABI or profiles', () => {
    const manifest = createManifest();
    for (const entry of manifest.packages) entry.version = '5.0.0';
    assert.equal(manifest.supportWindows.components5.rendererAbi, 1);
    assert.equal(manifest.supportWindows.components5.coreProfile, 'core/v1');
    assert.equal(manifest.supportWindows.components5.adapterProfile, 'stable-presentation/v1');
    assert.doesNotThrow(() => validateCompatibilityManifest(manifest));
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
        packageEntry.version = '5.99.0';
    }
    assert.doesNotThrow(() =>
        validateCompatibilityManifest(manifest, { rootDirectory: repositoryDirectory }),
    );

    const adapter = manifest.packages.find(
        ({ name }) => name === '@cratis/components.mui',
    );
    adapter.version = '5.98.0';
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
        packageEntry.version = '6.0.0';
    }
    assert.throws(
        () =>
            validateCompatibilityManifest(manifest, {
                rootDirectory: repositoryDirectory,
            }),
        /outside supported release families/,
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
