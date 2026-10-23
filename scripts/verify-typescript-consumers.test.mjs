// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTypeScriptVersions } from './verify-typescript-consumers.mjs';

test('checks both consumer compilers when no TypeScript argument is supplied', () => {
    assert.deepEqual(parseTypeScriptVersions([]), ['6', '7']);
});

for (const major of ['6', '7']) {
    test(`checks only TypeScript ${major} when selected by argument`, () => {
        assert.deepEqual(parseTypeScriptVersions(['--typescript', major]), [major]);
    });
}

for (const arguments_ of [
    ['--typescript'],
    ['--typescript', ''],
    ['--typescript', '5'],
    ['--typescript', '8'],
    ['--typescript', 'latest'],
    ['--typescript=6'],
    ['--unknown', '6'],
    ['6'],
    ['--typescript', '6', '--typescript', '7'],
]) {
    test(`rejects invalid consumer compiler arguments ${JSON.stringify(arguments_)}`, () => {
        assert.throws(() => parseTypeScriptVersions(arguments_), /Usage: verify-typescript-consumers/u);
    });
}

