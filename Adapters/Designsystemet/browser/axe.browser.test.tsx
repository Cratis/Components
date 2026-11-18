// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, it } from 'vitest';
import { axeViolations, colorSchemes, mountGallery, sizeModes, unmountGallery } from './gallery';

afterEach(unmountGallery);

describe('the Designsystemet slot gallery under axe (wcag22aa)', () => {
    for (const scheme of colorSchemes) {
        for (const size of sizeModes) {
            it(`has no violations in the ${scheme} scheme at size ${size}`, async () => {
                const gallery = await mountGallery(scheme, size);
                expect(await axeViolations(gallery)).toEqual([]);
            });
        }
    }
});
