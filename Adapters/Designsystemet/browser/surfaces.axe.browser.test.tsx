// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, it } from 'vitest';
import { axeViolations, colorSchemes, mountSurface, settle, sizeModes, surfaces, unmountSurface, type SurfaceName } from './surfaces';

afterEach(unmountSurface);

/** Open findings, asserted exactly so the test fails if one is fixed (remove the entry) or changes. None are open. */
const knownFindings: Readonly<Record<string, readonly string[]>> = {};

describe('the Designsystemet CommandForm, CommandDialog and DataPage surfaces under axe (wcag22aa)', () => {
    for (const name of Object.keys(surfaces) as SurfaceName[]) {
        for (const scheme of colorSchemes) {
            for (const size of sizeModes) {
                it(`${name} has no violations in the ${scheme} scheme at size ${size}`, async () => {
                    await mountSurface(name, scheme, size);
                    await settle();
                    expect(await axeViolations(document.body)).toEqual(knownFindings[`${name}/${scheme}/${size}`] ?? []);
                });
            }
        }
    }
});
