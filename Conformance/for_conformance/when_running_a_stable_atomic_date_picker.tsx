// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { useState } from 'react';
import { describe, it } from 'vitest';
import { atomicSlots as publishedDatePicker } from '../for_slot_contracts/snippets/datePicker.js';
import {
    builtInAtomicSlot,
    failedCheckIds,
    passedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

const run = (render: ReturnType<typeof builtInAtomicSlot<'display.datePicker'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('display.datePicker', render), 'display.datePicker');

// An adapter date picker whose calendar opens on a pointer press only, from a non-focusable trigger.
const PointerOnly = () => {
    const [open, setOpen] = useState(false);
    return (
        <div role='group' data-cratis-part='group'>
            <span role='button' data-cratis-part='trigger' onMouseDown={() => setOpen(!open)} />
            {open && <div data-cratis-part='calendar' />}
        </div>
    );
};

// An adapter date picker that closes on Escape but drops focus instead of returning it to the trigger.
const NoFocusReturn = () => {
    const [open, setOpen] = useState(false);
    return (
        <div role='group' data-cratis-part='group'>
            <button
                type='button'
                data-cratis-part='trigger'
                onClick={() => setOpen(!open)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setOpen(false);
                        event.currentTarget.blur();
                    }
                }}
            />
            {open && <div data-cratis-part='calendar' />}
        </div>
    );
};

describe('when running a stable atomic date picker', () => {
    it('should exercise and pass a conforming adapter date picker', async () => {
        const report = await run(builtInAtomicSlot('display.datePicker'));

        expect(failedCheckIds(report)).to.deep.equal([]);
        expect(
            report.checks.find((check) => check.id === 'behavior.display.datePicker')?.status,
        ).to.equal('passed');
    }, 30_000);

    it('should report a date picker that renders no parts', async () => {
        const report = await run(() => <div />);

        expect(failedCheckIds(report)).to.include('contract.display.datePicker.parts');
    }, 30_000);

    it('should pass a date picker whose trigger is a native button operated from the keyboard', async () => {
        const report = await run(publishedDatePicker['display.datePicker'].render);

        expect(passedCheckIds(report)).to.include.members([
            'behavior.display.datePicker.keyboard',
            'behavior.display.datePicker.focus',
            'behavior.display.datePicker.dismissal',
        ]);
    }, 30_000);

    it('should report a date picker whose calendar cannot be opened from the keyboard', async () => {
        const report = await run(PointerOnly);

        expect(failedCheckIds(report)).to.include('behavior.display.datePicker.keyboard');
    }, 30_000);

    it('should report a date picker that does not return focus to its trigger after Escape', async () => {
        const report = await run(NoFocusReturn);

        expect(failedCheckIds(report)).to.include('behavior.display.datePicker.focus');
    }, 30_000);

    it('should check keyboard, focus and dismissal behavior of the conforming date picker', async () => {
        const report = await run(builtInAtomicSlot('display.datePicker'));

        expect(passedCheckIds(report)).to.include.members([
            'behavior.display.datePicker.keyboard',
            'behavior.display.datePicker.focus',
            'behavior.display.datePicker.dismissal',
        ]);
    }, 30_000);
});
