// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import type { UserConfig as ViteConfig } from 'vite';
import { discoverAdapterPackages } from '../scripts/lib/adapter-inventory.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const inventory = discoverAdapterPackages(repositoryRoot);
const developmentRefs = process.env.CRATIS_STORYBOOK_DEV_REFS === 'true';
const refs = Object.fromEntries(
    inventory.adapters.map((adapter, index) => [
        adapter.metadata.id,
        {
            title: adapter.metadata.displayName,
            url: developmentRefs
                ? `http://localhost:${6100 + index}`
                : `./renderers/${adapter.metadata.id}`,
        },
    ]),
);

const config: StorybookConfig = {
    stories: ['./manager-placeholder.stories.ts'],
    tags: {
        'manager-placeholder': {
            defaultFilterSelection: 'exclude',
            excludeFromSidebar: true,
            excludeFromDocsStories: true,
        },
    },
    refs,
    addons: [],
    framework: { name: '@storybook/react-vite', options: {} },
    core: { builder: '@storybook/builder-vite' },
    viteFinal(existingConfig: ViteConfig) {
        return {
            ...existingConfig,
            server: { ...(existingConfig.server ?? {}), open: false },
        };
    },
};

export default config;
