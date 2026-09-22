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
    it('preserves historical Migrator 4 policy without claiming Components 5 support', () => {
        const historical = structuredClone(compatibilityManifest);
        historical.toolingCompatibility = { componentsCore: '>=4 <5', eslint: '>=4 <5', migrator: '>=4 <5' };
        delete historical.supportWindows.components5;
        historical.supportWindows.components3.tooling = '>=4 <5';
        historical.supportWindows.components4.status = 'current';
        historical.supportWindows.components4.tooling.migrator = '>=4 <5';
        for (const entry of historical.packages) {
            entry.version = '4.0.0';
            entry.releaseMajorRange = '>=4 <5';
            if (entry.peerDependencies['@cratis/components']) entry.peerDependencies['@cratis/components'] = '>=4 <5';
            for (const name of ['@cratis/arc', '@cratis/arc.react']) {
                if (entry.peerDependencies[name]) entry.peerDependencies[name] = '>=20.3.1 <23';
            }
        }
        expect(() => validateBundledManifest(historical, '4.0.0')).not.toThrow();
        expect(() => validateBundledManifest(historical, '5.0.0')).toThrow('outside bundled range');
        historical.packages[0].peerDependencies['@cratis/arc'] = '>=22.19.1 <23';
        expect(() => validateBundledManifest(historical, '4.0.0')).toThrow('peer contract');
    });

    it('rejects Components 5 metadata claiming the historical Arc floor', () => {
        const invalid = structuredClone(compatibilityManifest);
        invalid.packages[0].peerDependencies['@cratis/arc.react'] = '>=20.3.1 <23';
        expect(() => validateBundledManifest(invalid, '5.0.0')).toThrow('peer contract');
    });

    it('rejects a mismatched adapter family', () => {
        const invalid = structuredClone(compatibilityManifest);
        invalid.packages.find(({ role }) => role === 'renderer-adapter').peerDependencies['@cratis/components'] = '>=4 <5';
        expect(() => validateBundledManifest(invalid, '5.0.0')).toThrow('matching Components peer family');
    });
    it.each([
        ['3.6.1', 'source'],
        ['4.0.0', 'target'],
        ['4.99.0', 'target'],
        ['5.0.0', 'target'],
        ['5.99.0', 'target'],
    ])('accepts Components %s as a migration %s', (version, role) => {
        expect(preflightCompatibility({ cwd: createConsumer(version) })).toMatchObject({
            componentsVersion: version,
            migrationRole: role,
        });
    });

    it.each(['2.99.0', '6.0.0', '5.0.0-rc.1'])('rejects unsupported Components %s', (version) => {
        expect(() => preflightCompatibility({ cwd: createConsumer(version) })).toThrow(
            `@cratis/components@${version} is unsupported`,
        );
    });

    it('rejects an absent Components package', () => {
        const directory = mkdtempSync(path.join(tmpdir(), 'cratis-compatibility-'));
        temporaryDirectories.push(directory);
        expect(() => preflightCompatibility({ cwd: directory })).toThrow(
            'Could not resolve installed @cratis/components',
        );
    });

    it('rejects stale bundled migrator metadata', () => {
        const stale = structuredClone(compatibilityManifest);
        stale.packages.find(
            ({ name }) => name === '@cratis/components.migrator',
        ).version = '5.0.1';
        expect(() => validateBundledManifest(stale, '5.0.0')).toThrow(
            'stale migrator package metadata',
        );
    });

    it('rejects an invalid support-window tooling range', () => {
        const invalid = structuredClone(compatibilityManifest);
        invalid.supportWindows.components3.tooling = 'not-a-range';

        expect(() => validateBundledManifest(invalid, '5.0.0')).toThrow(
            'invalid migration support windows',
        );
    });

    it('rejects a manifest that expands the Components 3 source window', () => {
        const invalid = structuredClone(compatibilityManifest);
        invalid.supportWindows.components3.components = '>=2 <4';

        expect(() => validateBundledManifest(invalid, '5.0.0')).toThrow(
            'invalid migration support windows',
        );
    });

    it('rejects a manifest without the Components 4 target window', () => {
        const invalid = structuredClone(compatibilityManifest);
        delete invalid.supportWindows.components4;

        expect(() => validateBundledManifest(invalid, '5.0.0')).toThrow(
            'invalid migration support windows',
        );
    });
});
