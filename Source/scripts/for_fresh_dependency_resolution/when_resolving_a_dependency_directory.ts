// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
    assertNoLockfile,
    installedVersion,
    resolveDependencyDirectory,
} from '../lib/fresh-dependency-resolution.mjs';

const root = mkdtempSync(path.join(tmpdir(), 'cratis-fresh-dependency-resolution-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const install = (directory: string, name: string, version: string, extra: Record<string, unknown> = {}) => {
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name, version, main: 'index.js', ...extra }));
    writeFileSync(path.join(directory, 'index.js'), 'module.exports = {};');
};

// A nested install: the top-level motion-dom is the old release, framer-motion carries its own newer one.
install(path.join(root, 'node_modules', 'framer-motion'), 'framer-motion', '13.2.0');
install(path.join(root, 'node_modules', 'framer-motion', 'node_modules', 'motion-dom'), 'motion-dom', '13.5.0');
install(path.join(root, 'node_modules', 'motion-dom'), 'motion-dom', '12.0.0');
// A package whose `exports` hide its own package.json.
install(path.join(root, 'node_modules', 'sealed'), 'sealed', '1.0.0', { exports: { '.': './index.js' } });

describe('when resolving a dependency directory', () => {
    it('should find a nested install from the package that owns it', () => {
        const framerMotion = resolveDependencyDirectory(root, 'framer-motion');
        installedVersion(resolveDependencyDirectory(framerMotion, 'motion-dom')).should.equal('13.5.0');
    });

    it('should find the hoisted install from the project root', () => {
        installedVersion(resolveDependencyDirectory(root, 'motion-dom')).should.equal('12.0.0');
    });

    it('should find a package whose exports hide package.json', () => {
        installedVersion(resolveDependencyDirectory(root, 'sealed')).should.equal('1.0.0');
    });

    it('should name the dependency when it is not installed', () => {
        expect(() => resolveDependencyDirectory(root, 'not-installed')).toThrow(/not-installed/);
    });
});

describe('when checking a consumer project for a lockfile', () => {
    it('should accept a project without one', () => {
        expect(() => assertNoLockfile(root)).not.toThrow();
    });

    it('should reject a project that carries one', () => {
        const locked = mkdtempSync(path.join(root, 'locked-'));
        writeFileSync(path.join(locked, 'package-lock.json'), '{}');
        expect(() => assertNoLockfile(locked)).toThrow(/package-lock\.json/);
    });
});
