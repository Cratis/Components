// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import type { Alias, AliasOptions, Plugin, UserConfig as ViteConfig } from 'vite';
import {
    discoverAdapterPackages,
    requireAdapter,
} from '../scripts/lib/adapter-inventory.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const sourceRoot = path.join(repositoryRoot, 'Source');
const inventory = discoverAdapterPackages(repositoryRoot);
const adapter = requireAdapter(
    inventory,
    process.env.CRATIS_STORYBOOK_ADAPTER_ID ?? 'cratis-built-in',
);
const virtualModuleId = 'virtual:cratis-renderer-preview';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const posixPath = (value: string) => value.split(path.sep).join('/');

const existingAliases = (aliases: AliasOptions | undefined): Alias[] => {
    if (!aliases) return [];
    if (Array.isArray(aliases)) return [...aliases];
    return Object.entries(aliases).map(([find, replacement]) => ({
        find,
        replacement,
    }));
};

const rendererModule = () => {
    const environment = adapter.setupFile
        ? `import { RendererEnvironment, rendererSetup } from ${JSON.stringify(posixPath(adapter.setupFile))};`
        : `const RendererEnvironment = ({ children }) => children;\nconst rendererSetup = Object.freeze({});`;
    const library = adapter.builtIn
        ? 'const rendererProperties = {};'
        : [
              `import { ${adapter.metadata.export} as selectedLibrary } from ${JSON.stringify(posixPath(adapter.sourceEntry!))};`,
              "const rendererProperties = { library: selectedLibrary, libraryMode: 'strict', rendererFallback: 'core', rendererSetup };",
          ].join('\n');
    return `
import React from 'react';
import { CratisComponentsProvider } from '@cratis/components';
${environment}
${library}
export const rendererId = ${JSON.stringify(adapter.metadata.id)};
export const RendererPreviewProvider = ({ appearance, children }) => React.createElement(
    RendererEnvironment,
    { appearance },
    React.createElement(
        CratisComponentsProvider,
        { value: { locale: 'en-US' }, ...rendererProperties },
        children,
    ),
);
`;
};

const rendererVirtualModule = (): Plugin => ({
    name: 'cratis-renderer-preview',
    enforce: 'pre',
    resolveId(id) {
        return id === virtualModuleId ? resolvedVirtualModuleId : undefined;
    },
    load(id) {
        return id === resolvedVirtualModuleId ? rendererModule() : undefined;
    },
});

const primeReactVersions = (moduleIds: readonly string[]) => {
    const versions = new Map<string, string>();
    for (const rawId of moduleIds) {
        const id = rawId.replaceAll('\\', '/').split('?')[0];
        const marker = '/node_modules/primereact/';
        const markerIndex = id.lastIndexOf(marker);
        if (markerIndex < 0) continue;
        const packageFile = `${id.slice(0, markerIndex + marker.length - 1)}/package.json`;
        if (!existsSync(packageFile)) continue;
        const packageJson = JSON.parse(readFileSync(packageFile, 'utf8')) as {
            readonly version: string;
        };
        versions.set(packageFile, packageJson.version);
    }
    return [...new Set(versions.values())].sort();
};

const rendererBuildAttestation = (): Plugin => ({
    name: 'cratis-renderer-build-attestation',
    generateBundle() {
        const versions = primeReactVersions([...this.getModuleIds()]);
        const expected = adapter.expectedUpstreamVersion;
        if (expected && (versions.length !== 1 || versions[0] !== expected)) {
            this.error(
                `Renderer '${adapter.metadata.id}' expected primereact ${expected}, resolved ${versions.join(', ') || 'none'}.`,
            );
        }
        if (!expected && versions.length > 0) {
            this.error(
                `Renderer '${adapter.metadata.id}' unexpectedly reached primereact ${versions.join(', ')}.`,
            );
        }
        this.emitFile({
            type: 'asset',
            fileName: 'cratis-renderer-attestation.json',
            source: `${JSON.stringify(
                {
                    rendererId: adapter.metadata.id,
                    packageName: adapter.packageName,
                    primereactVersions: versions,
                    expectedPrimereactVersion: expected ?? null,
                    profileMode: adapter.builtIn ? 'zero-config' : 'strict',
                    nonProfileFallback: 'core',
                    primeReact11Boundary:
                        adapter.metadata.id === 'cratis-primereact'
                            ? 'public-context-with-boolean-attestation-no-license-manager'
                            : null,
                },
                null,
                2,
            )}\n`,
        });
    },
});

const config: StorybookConfig = {
    stories: ['../!(dist|node_modules|storybook-static)/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
    framework: { name: '@storybook/react-vite', options: {} },
    core: { builder: '@storybook/builder-vite' },
    staticDirs: [{ from: path.join(sourceRoot, 'public'), to: '/' }],
    async viteFinal(existingConfig: ViteConfig) {
        return {
            ...existingConfig,
            // Do not expose Vite's broad VITE_* environment namespace to preview modules. In
            // particular, a host-owned PrimeUI key can never cross into this test bundle.
            envPrefix: 'CRATIS_STORYBOOK_PUBLIC_',
            plugins: [
                ...(existingConfig.plugins ?? []),
                rendererVirtualModule(),
                rendererBuildAttestation(),
            ],
            resolve: {
                ...existingConfig.resolve,
                alias: [
                    {
                        find: /^@cratis\/components$/,
                        replacement: path.join(sourceRoot, 'index.ts'),
                    },
                    {
                        find: /^@cratis\/components\/(.+)$/,
                        replacement: `${posixPath(sourceRoot)}/$1/index.ts`,
                    },
                    ...existingAliases(existingConfig.resolve?.alias),
                ],
            },
            server: { ...(existingConfig.server ?? {}), open: false },
            build: {
                ...(existingConfig.build ?? {}),
                cssMinify: false,
                chunkSizeWarningLimit: 1200,
            },
        };
    },
};

export default config;
