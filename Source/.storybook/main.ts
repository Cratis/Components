// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { StorybookConfig } from '@storybook/react-vite';
import type { UserConfig as ViteConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    '../**/*.stories.@(ts|tsx)',
    '!../node_modules/**',
    '!../dist/**',
    '!../storybook-static/**'
  ],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  core: { builder: '@storybook/builder-vite' },
  staticDirs: ['../public'],
  // Ensure Vite dev server does not open the browser when Storybook starts
  async viteFinal(existingConfig: ViteConfig) {
    const cfg: ViteConfig = { ...existingConfig };
    cfg.server = { ...(cfg.server || {}), open: false } as unknown;
    // Use esbuild (lenient) to minify CSS instead of Vite's default lightningcss,
    // which rejects stylesheets that begin with a `//` comment ("Invalid empty
    // selector") and broke `storybook build`. esbuild matches the prior behavior.
    cfg.build = { ...(cfg.build || {}), cssMinify: 'esbuild' } as unknown;
    return cfg;
  }
};

export default config;
