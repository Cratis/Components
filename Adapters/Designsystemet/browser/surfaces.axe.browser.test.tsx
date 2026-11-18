// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { afterEach, describe, expect, it } from 'vitest';
import { axeViolations, colorSchemes, mountSurface, settle, sizeModes, surfaces, unmountSurface, type SurfaceName } from './surfaces';

afterEach(unmountSurface);

const stepperError =
    'color-contrast: section[aria-label="Basic Info"] > .w-full:nth-child(1) > small | section[aria-label="Basic Info"] > .w-full:nth-child(2) > small';

/**
 * Open findings, asserted exactly so the test fails if one is fixed (remove the entry) or changes.
 * Both are outside the Designsystemet adapter and are tracked in CONFORMANCE.md:
 * - the validation error text is a hard-coded #cc0000, 2.51:1 on the dark dialog surface;
 * - the secondary dialog button text bridges to 4.4:1 on the dark dialog surface (18px, needs 4.5:1).
 */
const knownFindings: Readonly<Record<string, readonly string[]>> = {
    'commandDialogOpen/dark/sm': ['color-contrast: .cratis-dialog__button--secondary > span'],
    'commandDialogOpen/dark/md': ['color-contrast: .cratis-dialog__button--secondary > span'],
    'stepperDialogOpen/dark/sm': [stepperError],
    'stepperDialogOpen/dark/md': [stepperError],
    'stepperDialogOpen/dark/lg': [stepperError],
};

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
