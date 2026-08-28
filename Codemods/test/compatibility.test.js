// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { preflightCompatibility, validateBundledManifest } from '../lib/compatibility.js';
import compatibilityManifest from '../compat-manifest.json' with { type: 'json' };

const temporaryDirectories = [];

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        rmSync(directory, { recursive: true, force: true });
    }
});

const createConsumer = (version) => {
    const directory = mkdtempSync(path.join(tmpdir(), 'cratis-compatibility-'));
    temporaryDirectories.push(directory);
    const packageDirectory = path.join(
        directory,
        'node_modules',
        '@cratis',
        'components',
    );
    mkdirSync(packageDirectory, { recursive: true });
    writeFileSync(
        path.join(packageDirectory, 'package.json'),
        `${JSON.stringify({
            name: '@cratis/components',
            version,
            exports: { './package.json': './package.json' },
        })}\n`,
    );
    return directory;
};

describe('compatibility preflight', () => {
    it.each([
        ['3.6.1', 'source'],
        ['4.0.0', 'target'],
    ])('accepts Components %s as a migration %s', (version, role) => {
        expect(preflightCompatibility({ cwd: createConsumer(version) })).toMatchObject({
            componentsVersion: version,
            migrationRole: role,
        });
    });

    it('rejects an unsupported Components version', () => {
        expect(() => preflightCompatibility({ cwd: createConsumer('5.0.0') })).toThrow(
            '@cratis/components@5.0.0 is unsupported',
        );
    });

    it('rejects an absent Components package', () => {
        const directory = mkdtempSync(path.join(tmpdir(), 'cratis-compatibility-'));
        temporaryDirectories.push(directory);
        expect(() => preflightCompatibility({ cwd: directory })).toThrow(
            'Could not resolve installed @cratis/components',
        );
    });

    it('rejects stale bundled codemod metadata', () => {
        const stale = structuredClone(compatibilityManifest);
        stale.packages.find(
            ({ name }) => name === '@cratis/components-codemods',
        ).version = '4.0.1';
        expect(() => validateBundledManifest(stale, '4.0.0')).toThrow(
            'stale codemod package metadata',
        );
    });

    it('rejects an invalid support-window tooling range', () => {
        const invalid = structuredClone(compatibilityManifest);
        invalid.supportWindows.components3.tooling = 'not-a-range';

        expect(() => validateBundledManifest(invalid, '4.0.0')).toThrow(
            'invalid migration support windows',
        );
    });
});
