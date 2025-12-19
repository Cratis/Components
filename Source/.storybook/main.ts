import type { StorybookConfig } from '@storybook/react-vite';
import type { UserConfig as ViteConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  core: { builder: '@storybook/builder-vite' },
  staticDirs: ['../public']
  // Ensure Vite dev server does not open the browser when Storybook starts
  async viteFinal(existingConfig: ViteConfig) {
    const cfg: ViteConfig = { ...existingConfig };
    cfg.server = { ...(cfg.server || {}), open: false } as any;
    return cfg;
  }
};

export default config;
