// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseConsumerArguments } from './verify-typescript-consumers.mjs';

const allVerifiers = [
    'Source/scripts/verify-public-types.mjs',
    'Source/scripts/verify-no-pixi-consumer.mjs',
    'Source/scripts/verify-spatial-consumer.mjs',
    'Conformance/scripts/verify-packed-package.mjs',
    'Adapters/Mui/scripts/verify-packed-package.mjs',
    'Adapters/PrimeReact/scripts/verify-packed-package.mjs',
    'Adapters/PrimeReact10/scripts/verify-packed-package.mjs',
];
const withoutPublicTypes = allVerifiers.slice(1);

test('checks both consumer compilers when no TypeScript argument is supplied', () => {
    assert.deepEqual(parseConsumerArguments([]).versions, ['6', '7']);
});

test('checks every packed consumer in the documented order when nothing is skipped', () => {
    assert.deepEqual(parseConsumerArguments([]).verifiers, allVerifiers);
});

for (const major of ['6', '7']) {
    test(`checks only TypeScript ${major} when selected by argument`, () => {
        assert.deepEqual(parseConsumerArguments(['--typescript', major]).versions, [major]);
    });
}

test('skips only the public-types verifier when CI runs it in its own job', () => {
    const parsed = parseConsumerArguments(['--skip-public-types']);
    assert.deepEqual(parsed.verifiers, withoutPublicTypes);
    assert.deepEqual(parsed.versions, ['6', '7']);
});

for (const [arguments_, major] of [
    [['--typescript', '6', '--skip-public-types'], '6'],
    [['--skip-public-types', '--typescript', '7'], '7'],
]) {
    test(`combines a selected compiler with skipping public types, in either order ${JSON.stringify(arguments_)}`, () => {
        const parsed = parseConsumerArguments(arguments_);
        assert.deepEqual(parsed.versions, [major]);
        assert.deepEqual(parsed.verifiers, withoutPublicTypes);
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
    ['--skip-public-types', '--skip-public-types'],
    ['--skip-public-types=true'],
    ['--typescript', '6', '--skip-public-types', 'x'],
]) {
    test(`rejects invalid consumer compiler arguments ${JSON.stringify(arguments_)}`, () => {
        assert.throws(() => parseConsumerArguments(arguments_), /Usage: verify-typescript-consumers/u);
    });
}
