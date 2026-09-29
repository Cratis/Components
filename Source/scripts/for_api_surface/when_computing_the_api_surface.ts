// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compareApiSurfaces, computeApiSurface } from '../lib/api-surface.mjs';

let packageDir: string;

const writePackage = (declarations: string, directory = packageDir, exports: Record<string, unknown> = {}) => {
    mkdirSync(path.join(directory, 'dist'), { recursive: true });
    writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
        name: 'example', exports: { './Example': { types: './dist/Example.d.ts', import: './dist/Example.js' }, ...exports },
    }));
    writeFileSync(path.join(directory, 'dist', 'Example.d.ts'), declarations);
};

const installExternalPackage = (directory: string) => {
    const external = path.join(directory, 'node_modules', '@example', 'external');
    mkdirSync(external, { recursive: true });
    writeFileSync(path.join(external, 'package.json'), JSON.stringify({ name: '@example/external', types: './index.d.ts' }));
    writeFileSync(path.join(external, 'index.d.ts'), 'export interface Shared { id: string; }\n');
};

describe('when computing the API surface', () => {
    beforeEach(() => {
        packageDir = mkdtempSync(path.join(os.tmpdir(), 'api-surface-spec-'));
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

    it('should record a re-export of another package by package and name, whether or not it resolves', () => {
        const declarations = "export { Shared } from '@example/external';\n";
        writePackage(declarations);
        installExternalPackage(packageDir);
        const resolved = computeApiSurface(packageDir);
        const unresolvedDir = mkdtempSync(path.join(os.tmpdir(), 'api-surface-spec-unresolved-'));
        let unresolved: ReturnType<typeof computeApiSurface>;
        try {
            writePackage(declarations, unresolvedDir);
            unresolved = computeApiSurface(unresolvedDir);
        } finally {
            rmSync(unresolvedDir, { recursive: true, force: true });
        }
        expect(resolved['./Example'].Shared).toBe('re-export of @example/external#Shared');
        expect(unresolved['./Example'].Shared).toBe(resolved['./Example'].Shared);
    });

    it('should record a star re-export of another package by package and name', () => {
        writePackage("export * from '@example/external';\n");
        installExternalPackage(packageDir);
        expect(computeApiSurface(packageDir)['./Example'].Shared).toBe('re-export of @example/external#Shared');
    });

    it('should report exporting a class only as a type as a change', () => {
        mkdirSync(path.join(packageDir, 'dist'), { recursive: true });
        writeFileSync(path.join(packageDir, 'dist', 'Widget.d.ts'), 'export declare class Widget { }\n');
        writePackage("export { Widget } from './Widget';\n");
        const before = computeApiSurface(packageDir);
        writePackage("export type { Widget } from './Widget';\n");
        const after = computeApiSurface(packageDir);
        expect(compareApiSurfaces(before, after)).toEqual({ removed: [], changed: ['./Example#Widget'], added: [] });
    });

    it('should include a typed JSON subpath and skip plain stylesheets', () => {
        mkdirSync(path.join(packageDir, 'dist'), { recursive: true });
        writeFileSync(path.join(packageDir, 'dist', 'schema.d.ts'), 'declare const schema: unknown;\nexport default schema;\n');
        writePackage('export declare const value: string;\n', packageDir, {
            './schema.json': { types: './dist/schema.d.ts', import: './dist/schema.json' },
            './styles': './dist/styles.css',
        });
        expect(Object.keys(computeApiSurface(packageDir))).toEqual(['./Example', './schema.json']);
    });

    it('should fail on a plain export target that is not a stylesheet or JSON', () => {
        writePackage('export declare const value: string;\n', packageDir, { './Plain': './dist/Plain.js' });
        expect(() => computeApiSurface(packageDir)).toThrow(/does not understand/u);
    });

    it('should report switching a star export to a type-only star export as a change', () => {
        mkdirSync(path.join(packageDir, 'dist'), { recursive: true });
        writeFileSync(path.join(packageDir, 'dist', 'Widget.d.ts'), 'export declare class Widget { }\n');
        writeFileSync(path.join(packageDir, 'dist', 'inner.d.ts'), "export * from './Widget';\n");
        writePackage("export * from './inner';\n");
        const before = computeApiSurface(packageDir);
        writeFileSync(path.join(packageDir, 'dist', 'inner.d.ts'), "export type * from './Widget';\n");
        const after = computeApiSurface(packageDir);
        expect(compareApiSurfaces(before, after)).toEqual({ removed: [], changed: ['./Example#Widget'], added: [] });
    });

    it('should record a package re-export the same way whatever the package does internally', () => {
        writePackage("export { Shared } from '@example/external';\n");
        installExternalPackage(packageDir);
        const external = path.join(packageDir, 'node_modules', '@example', 'external');
        writeFileSync(path.join(external, 'shared.d.ts'), 'export declare class Shared { }\n');
        writeFileSync(path.join(external, 'index.d.ts'), "export type { Shared } from './shared';\n");
        expect(computeApiSurface(packageDir)['./Example'].Shared).toBe('re-export of @example/external#Shared');
    });

    it('should describe a namespace re-export of an internal module by its export names', () => {
        mkdirSync(path.join(packageDir, 'dist'), { recursive: true });
        writeFileSync(path.join(packageDir, 'dist', 'inner.d.ts'), 'declare const hidden: number;\nexport declare const second: typeof hidden;\nexport declare class First { }\nexport {};\n');
        writePackage("export * as Inner from './inner';\n");
        expect(computeApiSurface(packageDir)['./Example'].Inner).toBe('namespace { First, second }');
    });
});
