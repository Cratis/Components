// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    optimizeDeps: {
        // Canvas messaging is loaded only by a subset of stories. Pre-bundle it before the browser
        // run so Vite never discovers it mid-suite, reloads the test page, and loses in-flight cases.
        include: ['@cratis/arc.react/messaging'],
    },
    plugins: [
        storybookTest({
            configDir: path.join(directory, '.storybook'),
            initialGlobals: {
                appearance: process.env.STORYBOOK_APPEARANCE ?? 'baseline-dark',
            },
        }),
    ],
    test: {
        name: 'storybook',
        browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
        },
    },
});
