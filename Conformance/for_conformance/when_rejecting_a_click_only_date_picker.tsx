// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { useState } from 'react';
import { describe, it } from 'vitest';
import {
    failedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

// ARIA supplies semantics, not the native keyboard activation of a button.
const ClickOnly = () => {
    const [open, setOpen] = useState(false);
    return (
        <div
            role='group'
            data-cratis-part='group'
            onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
        >
            <span
                role='button'
                tabIndex={0}
                data-cratis-part='trigger'
                onClick={() => setOpen(!open)}
            >
                Open calendar
            </span>
            {open && <div data-cratis-part='calendar' />}
        </div>
    );
};

describe('when rejecting a click-only date picker', () => {
    it('should fail keyboard conformance for a focusable role-button without key handlers', async () => {
        const library = libraryWithAtomicSlot('display.datePicker', ClickOnly);
        const report = await runAtomicSlotConformance(library, 'display.datePicker');

        expect(failedCheckIds(report)).to.include('behavior.display.datePicker.keyboard');
    }, 30_000);
});
