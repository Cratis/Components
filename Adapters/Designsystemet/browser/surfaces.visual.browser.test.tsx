// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, it } from 'vitest';
import { colorSchemes, mountSurface, settle, unmountSurface } from './surfaces';

// Injected by Storybook/vitest.designsystemet.config.ts through Vite's `define`.
declare const __CRATIS_LINUX_BASELINES__: boolean;

afterEach(unmountSurface);

// Only deterministic surfaces get baselines: the open CommandDialog and the paged DataPage (fixed
// data). The CommandForm story renders today's date, so it is covered by axe and keyboard only.
describe.skipIf(!__CRATIS_LINUX_BASELINES__)('the Designsystemet surfaces visual baseline', () => {
    for (const scheme of colorSchemes) {
        it(`matches the ${scheme} CommandDialog baseline`, async () => {
            await mountSurface('commandDialogOpen', scheme, 'md');
            await expect.poll(() => document.querySelector('[role=dialog]')).not.toBeNull();
            await settle();
            await expect(document.querySelector('[role=dialog]') as HTMLElement).toMatchScreenshot(`command-dialog-${scheme}`, {
                comparatorOptions: { threshold: 0.2, allowedMismatchedPixelRatio: 0.01 },
                screenshotOptions: { animations: 'disabled', caret: 'hide' },
            });
        });

        it(`matches the ${scheme} DataPage baseline`, async () => {
            const host = await mountSurface('dataPagePaged', scheme, 'md');
            await expect.poll(() => document.querySelectorAll('tbody tr').length).toBe(20);
            await settle();
            await expect(host).toMatchScreenshot(`data-page-${scheme}`, {
                comparatorOptions: { threshold: 0.2, allowedMismatchedPixelRatio: 0.01 },
                screenshotOptions: { animations: 'disabled', caret: 'hide' },
            });
        });
    }
});
