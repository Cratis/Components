// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    mkdtempSync,
    mkdirSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import {
    buildPublishableShape,
    prepareOutputDirectory,
    requireCleanWorkingTree,
    resolveEvidenceCommit,
    validateCleanWorkingTreeStatus,
} from './generate-release-evidence.mjs';
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

const createTarEntry = (entryName, value) => {
    const contents = Buffer.from(
        typeof value === 'string' ? value : JSON.stringify(value),
    );
    const blocks = [createTarHeader(entryName, contents), contents];
    const padding = (512 - (contents.length % 512)) % 512;
    if (padding > 0) blocks.push(Buffer.alloc(padding));
    return blocks;
};

const createArchive = (filePath, entries) => {
    const blocks = entries.flatMap(([entryName, value]) =>
        createTarEntry(entryName, value),
    );
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

test('evidence commit must match the checked-out HEAD', () => {
    assert.throws(
        () => resolveEvidenceCommit('0'.repeat(40)),
        /does not match checked-out HEAD/,
    );
});

test('release evidence rejects tracked working-tree drift', () => {
    assert.doesNotThrow(() => validateCleanWorkingTreeStatus(''));
    assert.throws(
        () => validateCleanWorkingTreeStatus(' M package.json'),
        /requires a clean working tree/,
    );
});

test('release evidence rejects untracked build inputs before binding to a commit', () => {
    withTemporaryDirectory((directory) => {
        const initialization = spawnSync('git', ['init', '--quiet'], { cwd: directory });
        assert.equal(initialization.status, 0);
        mkdirSync(path.join(directory, 'Source'));
        writeFileSync(
            path.join(directory, 'Source', 'untracked.ts'),
            'export const value = 42;\n',
        );

        assert.throws(
            () => requireCleanWorkingTree(directory, { includeUntracked: true }),
            /requires a clean working tree/,
        );
    });
});

test('publishable builds clean generated output before compiling', () => {
    const commands = [];
    buildPublishableShape(
        [{ name: '@cratis/example-adapter', role: 'renderer-adapter' }],
        (command, arguments_) => commands.push([command, arguments_]),
    );

    assert.deepEqual(commands, [
        ['yarn', ['workspace', '@cratis/example-adapter', 'run', 'clean']],
        ['yarn', ['workspace', '@cratis/example-adapter', 'run', 'build']],
    ]);
});

test('release evidence rejects a symlink as its output directory', () => {
    withTemporaryDirectory((directory) => {
        const target = path.join(directory, 'target');
        const output = path.join(directory, 'output');
        mkdirSync(target);
        symlinkSync(target, output, 'dir');

        assert.throws(
            () => prepareOutputDirectory(output),
            /must not be a symbolic link/,
        );
    });
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

test('archive parsing rejects decompressed data above its bounded evidence limit', () => {
    withTemporaryDirectory((directory) => {
        const archivePath = path.join(directory, 'oversized.tgz');
        writeFileSync(
            archivePath,
            gzipSync(Buffer.alloc(32 * 1024 * 1024 + 1), { mtime: 0 }),
        );

        assert.throws(
            () => readPackedPackageJson(archivePath),
            /decompressed size limit/,
        );
    });
});

test('archive parsing rejects hidden entries after the tar end marker', () => {
    withTemporaryDirectory((directory) => {
        const archivePath = path.join(directory, 'trailing-entry.tgz');
        const blocks = [
            ...createTarEntry('package/package.json', {
                name: '@cratis/example',
                version: '1.2.3',
            }),
            Buffer.alloc(512),
            ...createTarEntry('package/hidden.js', 'hidden'),
            Buffer.alloc(1024),
        ];
        writeFileSync(archivePath, gzipSync(Buffer.concat(blocks), { mtime: 0 }));

        assert.throws(
            () => readPackedPackageJson(archivePath),
            /non-zero data after its end marker/,
        );
    });
});

test('SBOM dependencies reject duplicate dependsOn references', () => {
    const sbom = createBoundSbom();
    sbom.components.push({
        type: 'library',
        name: 'dependency',
        version: '1.0.0',
        'bom-ref': 'dependency@1.0.0',
    });
    sbom.dependencies[0].dependsOn = ['dependency@1.0.0', 'dependency@1.0.0'];

    assert.throws(
        () =>
            validateSbom(sbom, {
                name: compatibilityEntry.name,
                version: compatibilityEntry.version,
                sha512: 'a'.repeat(128),
                tarball: 'cratis-example-1.2.3.tgz',
                commit: 'b'.repeat(40),
            }),
        /duplicate dependsOn reference/,
    );
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
