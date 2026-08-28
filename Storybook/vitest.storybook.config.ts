// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const storybookRoot = path.dirname(fileURLToPath(import.meta.url));
const rendererId = process.env.CRATIS_STORYBOOK_ADAPTER_ID ?? 'cratis-built-in';
const appearance = process.env.STORYBOOK_APPEARANCE ?? 'baseline-dark';

const plugins = await storybookTest({
    configDir: path.join(storybookRoot, 'preview'),
    initialGlobals: { appearance },
});

export default defineConfig({
    optimizeDeps: {
        include: ['@cratis/arc.react/messaging'],
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
