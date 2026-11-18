// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, it } from 'vitest';
import { colorSchemes, mountGallery, sizeModes, unmountGallery } from './gallery';

// Injected by Storybook/vitest.designsystemet.config.ts through Vite's `define`.
declare const __CRATIS_LINUX_BASELINES__: boolean;

afterEach(unmountGallery);

// Baselines are committed for Linux Chromium only (`*-chromium-linux.png`), rendered in the pinned
// Playwright image that CI also uses. Outside that controlled Linux Chromium the visual checks are skipped and `--update` is refused.
describe.skipIf(!__CRATIS_LINUX_BASELINES__)('the Designsystemet slot gallery visual baseline', () => {
    for (const scheme of colorSchemes) {
        for (const size of sizeModes) {
            it(`matches the ${scheme} ${size} baseline`, async () => {
                const gallery = await mountGallery(scheme, size);
                await expect(gallery).toMatchScreenshot(`slots-${scheme}-${size}`, {
                    comparatorOptions: { threshold: 0.2, allowedMismatchedPixelRatio: 0.01 },
                    screenshotOptions: { animations: 'disabled', caret: 'hide' },
                });
            });
        }
    }
});
