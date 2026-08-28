// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import {
    archiveBindingProperties,
    assertFileHashes,
    readPackedPackageJson,
    selectReleasePackages,
    validatePackedIdentity,
    validateSafeFilename,
    validateSbom,
} from './lib/release-evidence.mjs';

const createTarHeader = (entryName, contents) => {
    const header = Buffer.alloc(512);
    header.write(entryName, 0, 100, 'utf8');
    header.write('0000644\0', 100, 8, 'ascii');
    header.write('0000000\0', 108, 8, 'ascii');
    header.write('0000000\0', 116, 8, 'ascii');
    header.write(`${contents.length.toString(8).padStart(11, '0')}\0`, 124, 12, 'ascii');
    header.write('00000000000\0', 136, 12, 'ascii');
    header.fill(0x20, 148, 156);
    header[156] = '0'.charCodeAt(0);
    header.write('ustar\0', 257, 6, 'ascii');
    header.write('00', 263, 2, 'ascii');
    const checksum = [...header].reduce((total, byte) => total + byte, 0);
    header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');
    return header;
};

const createArchive = (filePath, entries) => {
    const blocks = [];
    for (const [entryName, value] of entries) {
        const contents = Buffer.from(
            typeof value === 'string' ? value : JSON.stringify(value),
        );
        blocks.push(createTarHeader(entryName, contents), contents);
        const padding = (512 - (contents.length % 512)) % 512;
        if (padding > 0) blocks.push(Buffer.alloc(padding));
    }
    blocks.push(Buffer.alloc(1024));
    writeFileSync(filePath, gzipSync(Buffer.concat(blocks), { mtime: 0 }));
};

const withTemporaryDirectory = (action) => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cratis-release-evidence-test-'));
    try {
        action(directory);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
};

const compatibilityEntry = {
    name: '@cratis/example',
    version: '1.2.3',
    role: 'tooling',
    private: false,
    packageAccess: 'public',
};

const createBoundSbom = () => ({
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    metadata: {
        component: {
            type: 'library',
            name: '@cratis/example',
            version: '1.2.3',
            'bom-ref': '@cratis/example@1.2.3',
            hashes: [{ alg: 'SHA-512', content: 'a'.repeat(128) }],
            properties: [
                {
                    name: archiveBindingProperties.archiveFilename,
                    value: 'cratis-example-1.2.3.tgz',
                },
                { name: archiveBindingProperties.archiveSha512, value: 'a'.repeat(128) },
                { name: archiveBindingProperties.commit, value: 'b'.repeat(40) },
            ],
        },
    },
    components: [],
    dependencies: [{ ref: '@cratis/example@1.2.3', dependsOn: [] }],
});

test('archive hash mismatch fails', () => {
    withTemporaryDirectory((directory) => {
        const archivePath = path.join(directory, 'example.tgz');
        writeFileSync(archivePath, 'archive bytes');
        assert.throws(
            () =>
                assertFileHashes(archivePath, {
                    sha256: '0'.repeat(64),
                    sha512: '0'.repeat(128),
                }),
            /hash mismatch/,
        );
    });
});

test('wrong packed package identity fails', () => {
    withTemporaryDirectory((directory) => {
        const archivePath = path.join(directory, 'example.tgz');
        createArchive(archivePath, [
            [
                'package/package.json',
                {
                    name: '@cratis/wrong',
                    version: '1.2.3',
                    publishConfig: { access: 'public' },
                },
            ],
        ]);
        const packedPackage = readPackedPackageJson(archivePath);
        assert.throws(
            () => validatePackedIdentity(packedPackage, compatibilityEntry),
            /identity\/access/,
        );
    });
});

test('missing SBOM archive binding fails', () => {
    const sbom = createBoundSbom();
    sbom.metadata.component.properties = sbom.metadata.component.properties.filter(
        ({ name }) => name !== archiveBindingProperties.archiveFilename,
    );
    assert.throws(
        () =>
            validateSbom(sbom, {
                name: compatibilityEntry.name,
                version: compatibilityEntry.version,
                sha512: 'a'.repeat(128),
                tarball: 'cratis-example-1.2.3.tgz',
                commit: 'b'.repeat(40),
            }),
        /missing archive binding/,
    );
});

test('path and filename traversal is rejected', () => {
    assert.throws(() => validateSafeFilename('../example.tgz'), /Unsafe/);
    assert.throws(() => validateSafeFilename('folder\\example.tgz'), /Unsafe/);
    withTemporaryDirectory((directory) => {
        const archivePath = path.join(directory, 'unsafe.tgz');
        createArchive(archivePath, [
            ['../package.json', '{}'],
            ['package/package.json', { name: '@cratis/example', version: '1.2.3' }],
        ]);
        assert.throws(() => readPackedPackageJson(archivePath), /Unsafe archive path/);
    });
});

test('release package order comes only from gaScope', () => {
    const manifest = {
        gaScope: { publicPackages: ['@cratis/second', '@cratis/first'] },
        packages: [
            { name: '@cratis/first', version: '1.0.0' },
            { name: '@cratis/second', version: '2.0.0' },
        ],
    };
    assert.deepEqual(
        selectReleasePackages(manifest).map(({ name }) => name),
        ['@cratis/second', '@cratis/first'],
    );
});
