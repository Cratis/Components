// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";
import path from 'path';
import { EmitMetadataPlugin } from '@cratis/arc.vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    optimizeDeps: {
        exclude: ['tslib']
    },
    esbuild: {
        supported: {
            'top-level-await': true,
        },
    },
    build: {
        outDir: './wwwroot',
        assetsDir: '',
        modulePreload: false,
        target: 'esnext',
        minify: false,
        cssCodeSplit: false,
        rollupOptions: {
            external: [
            ],
        },
    },
    test: {
        globals: true,
        environment: 'node',
        // Isolated, because several spec files mock the same module (@cratis/arc.react/dialogs) with
        // their own spies. With a shared module graph whichever file loaded first wins and the others
        // observe zero calls, which showed up as an intermittent "expected one closeDialog call, got 0".
        isolate: true,
        fileParallelism: false,
        pool: 'threads',
        // Stylesheets are stubbed out by default, which is right for the ones this package writes:
        // every layout declaration those specs assert on is an inline style, and processing CSS is
        // slow. Allotment's is the exception - its split view is laid out entirely by that
        // stylesheet, so a spec can only tell an honored rule from an inert one if the rule is
        // actually in the document. Scoped to that one file so nothing else pays for it.
        css: { include: [/allotment[\\/]dist[\\/]style\.css$/] },
        coverage: {
            provider: 'v8',
            exclude: [
                '**/for_*/**',
                '**/wwwroot/**',
                '**/api/**',
                '**/Api/**',
                '**/dist/**',
                '**/*.test.tsx',
                '**/*.d.ts',
                '**/declarations.ts',
            ],
        },
        exclude: ['**/dist/**', '**/node_modules/**', 'node_modules/**', '**/wwwroot/**', 'wwwroot/**', '**/given/**'],
        include: ['**/for_*/when_*/**/*.ts', '**/for_*/**/when_*.ts'],
        setupFiles: `${__dirname}/vitest.setup.ts`
    },
    plugins: [
        react(),
        tailwindcss(),
        EmitMetadataPlugin() as unknown as import('vite').PluginOption
    ],
    server: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 9000,
        open: false,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                ws: true
            },
            '/swagger': {
                target: 'http://localhost:5000'
            }
        }
    },
    resolve: {
        alias: {
            'Api': path.resolve('./Api'),
            'Components': path.resolve('./Components'),
            'Layout': path.resolve('./Layout'),
            'Features': path.resolve('./Features')
        }
    }
});
