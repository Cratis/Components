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
    // Vite's Storybook builder only forwards env vars prefixed `STORYBOOK_`/`VITE_`
    // into `import.meta.env` (its `envPrefix` default) — a plain `PRIMEUI_LICENSE`,
    // the name developers already export per PrimeReact's own docs, does not pass
    // that filter. Relay it explicitly via `define` rather than asking every
    // developer to keep a renamed `STORYBOOK_`-prefixed copy in sync.
    cfg.define = {
      ...(cfg.define || {}),
      'import.meta.env.PRIMEUI_LICENSE': JSON.stringify(process.env.PRIMEUI_LICENSE ?? '')
    };
    return cfg;
  }
};

export default config;
