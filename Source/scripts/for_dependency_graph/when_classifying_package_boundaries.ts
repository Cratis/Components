// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import {
    isKernelReactSpecifier,
    kernelEmittedPath,
    kernelSourcePaths,
} from '../../../ESLint/lib/kernelBoundary.js';
import {
    analyzeKernelBoundary,
    analyzeRendererBoundary,
    browserRuntimeReferences,
    isPixiSpecifier,
    isRendererFrameworkRuntimeSpecifier,
    isRendererVendorSpecifier,
    rendererBoundaryReport,
} from '../lib/dependency-graph.mjs';

const emptyClosure = { files: [], external: [] };

describe('when classifying package boundaries', () => {
    it.each([
        '@mui/material',
        '@mui/material/Button',
        '@emotion/react',
        '@emotion/styled/base',
        'primereact',
        'primereact/button',
        '@primereact/core',
        '@primeuix/themes/aura',
    ])('should classify renderer-vendor specifier %s', (specifier: string) => {
        expect(isRendererVendorSpecifier(specifier)).toBe(true);
    });

    it.each([
        '@mui',
        '@muiish/material',
        '@emotion',
        '@emotional/react',
        'primereacts',
        'primereactor/button',
        '@primereact',
        '@primereactive/core',
        '@primeuix',
        '@primeui/themes',
    ])('should allow near-miss package name %s', (specifier: string) => {
        expect(isRendererVendorSpecifier(specifier)).toBe(false);
    });

    it('should defer the renderer boundary until the export exists', () => {
        expect(rendererBoundaryReport(undefined, ['Common'])).toMatchObject({
            status: 'deferred',
            reason: "The './renderer' export is not present.",
            violations: [],
        });
    });

    it('should activate the renderer boundary when the export exists', () => {
        expect(
            rendererBoundaryReport(
                {
                    runtime: {
                        files: ['renderer/index.js'],
                        external: ['react'],
                    },
                    declarations: emptyClosure,
                },
                ['Common'],
            ),
        ).toMatchObject({
            status: 'passed',
            runtimeExternalDependencies: [],
        });
    });

    it('should allow owned prop declarations and React types in the renderer declaration closure', () => {
        const result = analyzeRendererBoundary(
            { files: ['renderer/index.js', 'renderer/manifest.js'], external: [] },
            {
                files: [
                    'renderer/index.d.ts',
                    'renderer/slots.d.ts',
                    'Common/Button.d.ts',
                ],
                external: ['react'],
            },
            ['Common', 'Dialogs'],
        );

        expect(result.violations).toEqual([]);
    });

    it.each(['react', 'react/jsx-runtime'])(
        'should allow renderer framework runtime dependency %s',
        (specifier: string) => {
            expect(isRendererFrameworkRuntimeSpecifier(specifier)).toBe(true);
            const result = analyzeRendererBoundary(
                { files: ['renderer/index.js'], external: [specifier] },
                emptyClosure,
                ['Common'],
            );
            expect(result.violations).toEqual([]);
        },
    );

    it('should report non-framework runtime external dependencies', () => {
        const result = analyzeRendererBoundary(
            { files: ['renderer/index.js'], external: ['react', 'left-pad'] },
            emptyClosure,
            ['Common'],
        );

        expect(result.runtimeExternalDependencies).toEqual(['left-pad']);
        expect(result.violations).toEqual([
            'runtime closure reaches external dependencies: left-pad',
        ]);
    });

    it('should report runtime component implementation files', () => {
        const result = analyzeRendererBoundary(
            {
                files: ['renderer/index.js', 'Common/Button.js', 'Dialogs/Dialog.js'],
                external: [],
            },
            emptyClosure,
            ['Common', 'Dialogs'],
        );

        expect(result.runtimeComponentImplementationFiles).toEqual([
            'Common/Button.js',
            'Dialogs/Dialog.js',
        ]);
        expect(result.violations).toEqual([
            'runtime closure reaches component implementation files: Common/Button.js, Dialogs/Dialog.js',
        ]);
    });

    it('should report renderer-vendor types in declarations', () => {
        const result = analyzeRendererBoundary(
            emptyClosure,
            {
                files: ['renderer/index.d.ts'],
                external: ['react', '@mui/material', '@primeuix/themes'],
            },
            ['Common'],
        );

        expect(result.declarationVendorDependencies).toEqual([
            '@mui/material',
            '@primeuix/themes',
        ]);
    });

    it.each(['pixi.js', 'pixi.js/app'])(
        'should preserve Pixi classification for %s',
        (specifier: string) => {
            expect(isPixiSpecifier(specifier)).toBe(true);
        },
    );

    it.each(['pixi', 'pixi.jsx', '@pixi.js/app'])(
        'should preserve Pixi near-miss classification for %s',
        (specifier: string) => {
            expect(isPixiSpecifier(specifier)).toBe(false);
        },
    );

    it('should derive emitted kernel entries from the canonical source inventory', () => {
        expect(kernelSourcePaths).toContain('Source/PivotViewer/engine/store.ts');
        expect(kernelEmittedPath('Source/PivotViewer/engine/store.ts', '.d.ts')).toBe(
            'PivotViewer/engine/store.d.ts',
        );
    });

    it.each([
        'react',
        'react/jsx-runtime',
        'react-dom/client',
        'react-aria-components/Button',
    ])('should classify forbidden kernel dependency %s', (specifier: string) => {
        expect(isKernelReactSpecifier(specifier)).toBe(true);
    });

    it.each(['reactive', 'react-dom-extra', 'react-aria-components-extra'])(
        'should allow kernel dependency near miss %s',
        (specifier: string) => {
            expect(isKernelReactSpecifier(specifier)).toBe(false);
        },
    );

    it('should report React dependencies in either emitted kernel closure', () => {
        const result = analyzeKernelBoundary(
            { files: ['kernel.js'], external: ['react-dom/client', 'left-pad'] },
            { files: ['kernel.d.ts'], external: ['react', '@cratis/fundamentals'] },
        );

        expect(result.runtimeReactDependencies).toEqual(['react-dom/client']);
        expect(result.declarationReactDependencies).toEqual(['react']);
        expect(result.violations).toHaveLength(2);
    });

    it('should report browser DOM globals in an emitted kernel runtime closure', () => {
        const sourceFile = ts.createSourceFile(
            'kernel.js',
            "const local = { document: 'near miss' }; window.addEventListener('load', () => local.document);",
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.JS,
        );
        const references = browserRuntimeReferences(sourceFile);
        const result = analyzeKernelBoundary(emptyClosure, emptyClosure, [
            { file: 'kernel.js', name: references[0] },
        ]);

        expect(references).toEqual(['window']);
        expect(result.browserRuntimeEdges).toEqual([
            { file: 'kernel.js', name: 'window' },
        ]);
        expect(result.violations).toEqual([
            'runtime closure reaches browser DOM globals: kernel.js:window',
        ]);
    });

    it('should report browser DOM types in an emitted kernel declaration closure', () => {
        const sourceFile = ts.createSourceFile(
            'kernel.d.ts',
            'export interface Port { element: HTMLElement; event: Event; }',
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );
        const references = browserRuntimeReferences(sourceFile);
        const result = analyzeKernelBoundary(
            emptyClosure,
            emptyClosure,
            [],
            references.map((name) => ({ file: 'kernel.d.ts', name })),
        );

        expect(references).toEqual(['Event', 'HTMLElement']);
        expect(result.browserDeclarationEdges).toEqual([
            { file: 'kernel.d.ts', name: 'Event' },
            { file: 'kernel.d.ts', name: 'HTMLElement' },
        ]);
        expect(result.violations).toEqual([
            'declaration closure reaches browser DOM globals: kernel.d.ts:Event, kernel.d.ts:HTMLElement',
        ]);
    });
});
