// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { prepareRelease } from './prepare-release.mjs';
import { createCompatibilityManifest } from './generate-compat-manifest.mjs';
import { validateBundledManifest } from '../Migrator/lib/compatibility.js';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(repository, '.ai-work/manual/typed-auto-command-forms-20260922/release-fixtures');
const files = ['package.json', 'Source/package.json', 'ESLint/package.json', 'Migrator/package.json',
    'Conformance/package.json', 'Adapters/Mui/package.json', 'Adapters/PrimeReact/package.json',
    'Adapters/PrimeReact10/package.json', 'Storybook/package.json', 'scripts/renderer-adapter-matrix.json'];

function fixture(check) {
    mkdirSync(output, { recursive: true });
    const directory = mkdtempSync(path.join(output, 'case-'));
    try {
        for (const relative of files) {
            mkdirSync(path.dirname(path.join(directory, relative)), { recursive: true });
            copyFileSync(path.join(repository, relative), path.join(directory, relative));
        }
        mkdirSync(path.join(directory, 'Conformance/for_plain_dom_renderer'), { recursive: true });
        check(directory);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

test('release preparation rejects an untruthful Arc contract before changing any packages', () => fixture((directory) => {
    const file = path.join(directory, 'Source/package.json');
    const core = JSON.parse(readFileSync(file, 'utf8'));
    core.peerDependencies['@cratis/arc'] = '>=20.3.1 <23';
    writeFileSync(file, JSON.stringify(core));
    const before = files.map((relative) => readFileSync(path.join(directory, relative), 'utf8'));
    assert.throws(() => prepareRelease('5.0.0', directory), /peer contract/);
    assert.deepEqual(files.map((relative) => readFileSync(path.join(directory, relative), 'utf8')), before);
}));

for (const version of ['5.0.0', '5.2.1']) {
    test(`release preparation accepts ${version} and stamps all bundled metadata before publication`, () => fixture((directory) => {
        prepareRelease(version, directory);
        const manifest = createCompatibilityManifest(directory);
        assert.ok(manifest.packages.every((entry) => entry.version === version));
        assert.ok(manifest.packages.filter((entry) => entry.peerDependencies['@cratis/components'])
            .every((entry) => entry.peerDependencies['@cratis/components'] === '>=5 <6'));
        for (const relative of ['compat-manifest.json', 'Source/compat-manifest.json', 'Migrator/compat-manifest.json']) {
            const bundled = JSON.parse(readFileSync(path.join(directory, relative), 'utf8'));
            assert.deepEqual(bundled, manifest);
            validateBundledManifest(bundled, version);
        }
    }));
}

for (const version of ['4.13.0', '6.0.0', '5.0.0-rc.1', '5.0.0+metadata', 'v5.0.0', 'invalid']) {
    test(`release preparation rejects ${version} without changing package metadata`, () => fixture((directory) => {
        const before = files.map((relative) => readFileSync(path.join(directory, relative), 'utf8'));
        assert.throws(() => prepareRelease(version, directory), /reviewed source family|supported release families/);
        assert.deepEqual(files.map((relative) => readFileSync(path.join(directory, relative), 'utf8')), before);
    }));
}
