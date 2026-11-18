// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const storybookRoot = path.dirname(fileURLToPath(import.meta.url));
const adapterRoot = path.resolve(storybookRoot, '../Adapters/Designsystemet');

// Baseline generation drives Chromium inside the pinned Playwright image, with the host's loopback exposed to it (see
// Adapters/Designsystemet/scripts/update-baselines.sh); CI runs Chromium in that image directly.
const remoteChromium = process.env.CRATIS_PLAYWRIGHT_WS;

// Linux baselines may only be compared or written by the controlled Linux Chromium: the pinned
// Playwright image driven remotely, or CI running inside that image. Anywhere else the names would
// say `linux` for pixels another OS rendered.
const controlledLinuxChromium = Boolean(remoteChromium) || (process.env.CI === 'true' && process.platform === 'linux');
if (!controlledLinuxChromium && process.argv.some((argument) => argument === '--update' || argument === '-u')) {
    throw new Error('Refusing to update visual baselines outside the pinned Linux Chromium. Run Adapters/Designsystemet/scripts/update-baselines.sh --update.');
}

export default defineConfig({
    define: { __CRATIS_LINUX_BASELINES__: JSON.stringify(controlledLinuxChromium) },
    root: adapterRoot,
    plugins: [react()],
    optimizeDeps: {
        include: ['axe-core', '@cratis/arc.react/commands', '@cratis/arc.react/dialogs', '@cratis/arc.react/queries', '@cratis/arc.react/stories', '@cratis/arc/commands', '@cratis/arc/queries', '@cratis/arc/reflection', '@cratis/arc/validation', '@cratis/fundamentals', '@storybook/react', 'allotment', 'react-aria-components/Modal', 'react-aria-components/Popover', 'react-aria-components/Select', 'storybook/test', '@digdir/designsystemet-react', 'react-aria-components/Breadcrumbs', 'react-aria-components/TagGroup', 'react-aria-components/ToggleButtonGroup'],
    },
    test: {
        name: 'designsystemet-browser',
        include: ['browser/**/*.browser.test.tsx'],
        testTimeout: 60_000,
        // Focus, :focus-visible and keyboard behaviour need a foreground page, so run one file at a time.
        fileParallelism: false,
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(remoteChromium ? { connectOptions: { wsEndpoint: remoteChromium, exposeNetwork: '<loopback>' } } : {}),
            expect: {
                toMatchScreenshot: {
                    // Baselines are Linux-only whatever platform drives the run, so the name never says darwin or win32.
                    resolveScreenshotPath: ({ root, testFileDirectory, testFileName, arg, browserName, ext }) =>
                        path.join(root, testFileDirectory, '__screenshots__', testFileName, `${arg}-${browserName}-linux${ext}`),
                },
            },
            instances: [{ browser: 'chromium' }],
            commands: {
                // Media emulation is page-wide, so it reaches the test iframe as well.
                emulateMedia: async (context, options: { forcedColors?: 'active' | 'none'; reducedMotion?: 'reduce' | 'no-preference' }) => {
                    await (context as unknown as { page: { emulateMedia(o: unknown): Promise<void> } }).page.emulateMedia(options);
                },
            },
        },
    },
});
