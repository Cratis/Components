// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import typescript from 'typescript';
import { getTypeScriptCompiler } from './lib/typescript-compiler.mjs';

for (const major of ['6', '7']) {
    test(`selects and executes the installed TypeScript ${major} compiler`, () => {
        const compiler = getTypeScriptCompiler(major);
        const result = spawnSync(process.execPath, [compiler.path, '--version'], { encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
        assert.equal(result.stdout.trim(), `Version ${compiler.version}`);
        assert.ok(compiler.version.startsWith(`${major}.`));
    });
}

for (const major of ['', '5', '8', 'latest', '/tmp/tsc']) {
    test(`rejects unsupported compiler selection '${major}' without falling back`, () => {
        assert.throws(() => getTypeScriptCompiler(major), /Unsupported CRATIS_TYPESCRIPT_VERSION/u);
    });
}

test('retains the TypeScript 6 compiler API for Rollup, ESLint, and Storybook', () => {
    assert.ok(typescript.version.startsWith('6.'));
    assert.equal(typeof typescript.createProgram, 'function');
    assert.equal(typeof typescript.transpileModule, 'function');
});
