// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import type { ComponentType } from 'react';
import type { CratisAtomicSlotId } from '@cratis/components/renderer';
import { describe, it } from 'vitest';
import { atomicSlots as datePicker } from '../for_slot_contracts/snippets/datePicker.js';
import { atomicSlots as dialog } from '../for_slot_contracts/snippets/dialog.js';
import { atomicSlots as numberInput } from '../for_slot_contracts/snippets/numberInput.js';
import { atomicSlots as paginator } from '../for_slot_contracts/snippets/paginator.js';
import { atomicSlots as select } from '../for_slot_contracts/snippets/select.js';
import { atomicSlots as tooltip } from '../for_slot_contracts/snippets/tooltip.js';
import {
    failedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

// The page published from these snippets states a behavior contract, so every snippet must meet every behavior check.
// The snippets stay minimal and do not render every part or state, so part and state coverage is out of scope.
const snippets = [
    ...Object.entries(datePicker),
    ...Object.entries(dialog),
    ...Object.entries(numberInput),
    ...Object.entries(paginator),
    ...Object.entries(select),
    ...Object.entries(tooltip),
] as [CratisAtomicSlotId, { render: ComponentType<never> }][];

describe('when running the published slot snippets', () => {
    it.each(snippets)('should pass every behavior check for the %s snippet', async (slotId, declaration) => {
        const report = await runAtomicSlotConformance(
            libraryWithAtomicSlot(slotId, declaration.render as never),
            slotId,
        );

        expect(failedCheckIds(report).filter((id) => id.startsWith('behavior.'))).to.deep.equal([]);
    }, 30_000);
});
