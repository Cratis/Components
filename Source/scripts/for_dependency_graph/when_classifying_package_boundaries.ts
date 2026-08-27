// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describe, expect, it } from 'vitest';
import {
    analyzeRendererBoundary,
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
});
