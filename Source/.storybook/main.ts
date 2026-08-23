// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { StorybookConfig } from '@storybook/react-vite';
import type { UserConfig as ViteConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../!(dist|node_modules|storybook-static)/**/*.stories.@(ts|tsx)'],
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
    cfg.server = { ...(cfg.server || {}), open: false };
    cfg.build = {
      ...(cfg.build || {}),
      cssMinify: false,
      // The preview index includes Storybook's manager runtime and every story entry;
      // it is documentation output rather than a consumer package chunk.
      chunkSizeWarningLimit: 1800
    };
    return cfg;
  }
};

export default config;
