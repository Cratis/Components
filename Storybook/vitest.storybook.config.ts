// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const storybookRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(storybookRoot, '..');
const rendererId = process.env.CRATIS_STORYBOOK_ADAPTER_ID ?? 'cratis-built-in';
const appearance = process.env.STORYBOOK_APPEARANCE ?? 'baseline-dark';
const rendererDependenciesById: Readonly<Record<string, readonly string[]>> = {
    'cratis-mui': [
        '@mui/material/Button',
        '@mui/material/Checkbox',
        '@mui/material/IconButton',
        '@mui/material/InputBase',
        '@mui/material/LinearProgress',
        '@mui/material/Paper',
        '@mui/material/Radio',
        '@mui/material/Switch',
        '@mui/material/Tooltip',
        '@mui/material/styles',
    ],
    'cratis-primereact': [
        '@primereact/core/config',
        '@primereact/core/locale',
        '@primereact/core/passthrough',
        '@primereact/core/theme',
        '@primereact/ui/button',
        '@primereact/ui/card',
        '@primereact/ui/checkbox',
        '@primereact/ui/inputtext',
        '@primereact/ui/progressbar',
        '@primereact/ui/radiobutton',
        '@primereact/ui/textarea',
        '@primereact/ui/toggleswitch',
        '@primeuix/themes/aura',
    ],
    'cratis-primereact10': [
        'primereact/api',
        'primereact/api/api.cjs.js',
        'primereact/button/button.cjs.js',
        'primereact/card/card.cjs.js',
        'primereact/checkbox/checkbox.cjs.js',
        'primereact/inputswitch/inputswitch.cjs.js',
        'primereact/inputtext/inputtext.cjs.js',
        'primereact/inputtextarea/inputtextarea.cjs.js',
        'primereact/progressbar/progressbar.cjs.js',
        'primereact/radiobutton/radiobutton.cjs.js',
    ],
};
const rendererDependencies = rendererDependenciesById[rendererId] ?? [];
const primeReactRoot =
    rendererId === 'cratis-primereact10'
        ? path.join(repositoryRoot, 'Adapters/PrimeReact10/node_modules/primereact')
        : rendererId === 'cratis-primereact'
          ? path.join(repositoryRoot, 'node_modules/primereact')
          : undefined;

const plugins = await storybookTest({
    configDir: path.resolve(storybookRoot, '../Source/.storybook-renderers'),
    initialGlobals: { appearance },
});

export default defineConfig({
    resolve: {
        alias: primeReactRoot
            ? [
                  { find: /^primereact\/(.+)$/u, replacement: `${primeReactRoot}/$1` },
                  { find: 'primereact', replacement: primeReactRoot },
              ]
            : [],
    },
    optimizeDeps: {
        include: ['@cratis/arc.react/messaging', ...rendererDependencies],
    },
    plugins,
    test: {
        name: `storybook:${rendererId}:${appearance}`,
        browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
        },
    },
});
