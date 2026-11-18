// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, it } from 'vitest';
import { colorSchemes, mountGallery, sizeModes, unmountGallery } from './gallery';

afterEach(unmountGallery);

// Baselines are committed for Linux Chromium only (`*-chromium-linux.png`), rendered in the pinned
// Playwright image that CI also uses. Other platforms write untracked, git-ignored files.
describe('the Designsystemet slot gallery visual baseline', () => {
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
