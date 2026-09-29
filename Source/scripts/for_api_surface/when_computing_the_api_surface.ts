// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compareApiSurfaces, computeApiSurface } from '../lib/api-surface.mjs';

let packageDir: string;

const writePackage = (declarations: string) => {
    writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({
        name: 'example', exports: { './Example': { types: './dist/Example.d.ts', import: './dist/Example.js' } },
    }));
    writeFileSync(path.join(packageDir, 'dist', 'Example.d.ts'), declarations);
};

describe('when computing the API surface', () => {
    beforeEach(() => {
        packageDir = mkdtempSync(path.join(os.tmpdir(), 'api-surface-spec-'));
        mkdirSync(path.join(packageDir, 'dist'));
    });
    afterEach(() => rmSync(packageDir, { recursive: true, force: true }));

    it('should describe a destructured component parameter by its type alone', () => {
        writePackage(
            '/** A documented example. */\n' +
            'export interface ExampleProps { label: string; }\n' +
            'export declare const Example: ({ label, }: ExampleProps) => void;\n',
        );
        const surface = computeApiSurface(packageDir);
        expect(surface['./Example'].Example).toBe('Example: (props: ExampleProps) => void');
        expect(surface['./Example'].ExampleProps).toBe('export interface ExampleProps { label: string; }');
    });

    it('should report a new prop only as a change to the props type', () => {
        writePackage('export interface ExampleProps { label: string; }\nexport declare const Example: ({ label, }: ExampleProps) => void;\n');
        const before = computeApiSurface(packageDir);
        writePackage('export interface ExampleProps { label: string; icon?: string; }\nexport declare const Example: ({ label, icon, }: ExampleProps) => void;\n');
        const after = computeApiSurface(packageDir);
        expect(compareApiSurfaces(before, after)).toEqual({ removed: [], changed: ['./Example#ExampleProps'], added: [] });
    });
});
