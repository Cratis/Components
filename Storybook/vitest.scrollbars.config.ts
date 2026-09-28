// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    optimizeDeps: { include: ['@cratis/arc.react/messaging'] },
    plugins: [react()],
    test: {
        include: ['Filter/scrollbars.browser.test.tsx'],
        testTimeout: 60_000,
        browser: {
            enabled: true,
            headless: true,
            // This suite alone needs the classic viewport gutter suppressed by Playwright's default args.
            provider: playwright({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } }),
            instances: [{ browser: 'chromium' }],
        },
    },
});
