// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseNpmPackResult } from './lib/parse-npm-pack-result.mjs';

const packageName = '@cratis/example-package';
const packed = {
    name: packageName,
    filename: 'cratis-example-package-1.0.0.tgz',
    files: [{ path: 'dist/index.js' }, { path: 'package.json' }],
};

for (const [format, result] of [
    ['legacy array', [packed]],
    ['npm 12 package-name map', { [packageName]: packed }],
]) {
    test(`reads the ${format} without changing archive metadata`, () => {
        assert.deepEqual(parseNpmPackResult(JSON.stringify(result), packageName), packed);
    });

    test(`reads the ${format} after lifecycle output containing brackets and braces`, () => {
        const output = '[build] compiling\n{not JSON}\n> example-package prepare\n' +
            JSON.stringify(result, null, 2) + '\n';
        assert.deepEqual(parseNpmPackResult(output, packageName), packed);
    });

    test(`rejects multiple packages in the ${format}`, () => {
        const other = { ...packed, name: '@cratis/another-example' };
        const multiple = Array.isArray(result)
            ? [packed, other]
            : { [packageName]: packed, [other.name]: other };
        assert.throws(
            () => parseNpmPackResult(JSON.stringify(multiple), packageName),
            /must return exactly one package/u,
        );
    });

    for (const [description, invalid] of [
        ['wrong package', { ...packed, name: '@cratis/another-example' }],
        ['missing filename', { ...packed, filename: undefined }],
        ['empty filename', { ...packed, filename: '' }],
        ['missing file list', { ...packed, files: undefined }],
        ['invalid file list', { ...packed, files: {} }],
        ['missing file path', { ...packed, files: [{}] }],
        ['invalid file path', { ...packed, files: [{ path: 42 }] }],
        ['empty file path', { ...packed, files: [{ path: '' }] }],
        ['null file entry', { ...packed, files: [null] }],
        ['null package', null],
    ]) {
        test(`rejects ${description} in the ${format}`, () => {
            const output = JSON.stringify(Array.isArray(result) ? [invalid] : { [packageName]: invalid });
            assert.throws(
                () => parseNpmPackResult(output, packageName),
                /invalid package metadata/u,
            );
        });
    }
}

for (const output of ['', 'not JSON', '[', '{', '[build] no JSON follows', '[{}] trailing garbage']) {
    test(`rejects malformed output ${JSON.stringify(output)}`, { timeout: 1000 }, () => {
        assert.throws(
            () => parseNpmPackResult(output, packageName),
            /did not produce a parseable JSON result/u,
        );
    });
}

for (const result of [[], {}]) {
    test(`rejects an empty result ${JSON.stringify(result)}`, () => {
        assert.throws(
            () => parseNpmPackResult(JSON.stringify(result), packageName),
            /must return exactly one package/u,
        );
    });
}
