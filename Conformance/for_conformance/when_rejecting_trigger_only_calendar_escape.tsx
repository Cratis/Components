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

const TriggerOnlyEscape = () => {
    const [open, setOpen] = useState(false);
    return (
        <div role='group' data-cratis-part='group'>
            <button
                type='button'
                data-cratis-part='trigger'
                onClick={() => setOpen(!open)}
                onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
            >
                Open calendar
            </button>
            {open && (
                <div data-cratis-part='calendar'>
                    <button type='button' data-cratis-part='today'>Today</button>
                </div>
            )}
        </div>
    );
};

describe('when rejecting trigger-only calendar Escape handling', () => {
    it('should check dismissal and focus return from inside the calendar', async () => {
        const library = libraryWithAtomicSlot('display.datePicker', TriggerOnlyEscape);
        const report = await runAtomicSlotConformance(library, 'display.datePicker');

        expect(failedCheckIds(report)).to.include('behavior.display.datePicker.dismissal');
        expect(failedCheckIds(report)).to.include('behavior.display.datePicker.focus');
    }, 30_000);
});
