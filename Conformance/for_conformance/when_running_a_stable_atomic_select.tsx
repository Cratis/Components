// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { useState } from 'react';
import { describe, it } from 'vitest';
import {
    builtInAtomicSlot,
    failedCheckIds,
    passedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

const run = (render: ReturnType<typeof builtInAtomicSlot<'dropdown.select'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('dropdown.select', render), 'dropdown.select');

// An adapter select that opens its listbox on a pointer press only, never from the keyboard.
const PointerOnly = () => {
    const [open, setOpen] = useState(false);
    return (
        <div data-cratis-part='root'>
            <button type='button' data-cratis-part='trigger' aria-haspopup='listbox' onClick={() => setOpen(!open)}>
                Choose
            </button>
            {open && <ul role='listbox' data-cratis-part='listbox' />}
        </div>
    );
};

describe('when running a stable atomic select', () => {
    it('should exercise and pass a conforming adapter select', async () => {
        const report = await run(builtInAtomicSlot('dropdown.select'));

        expect(failedCheckIds(report)).to.deep.equal([]);
        expect(
            report.checks.find((check) => check.id === 'behavior.dropdown.select')?.status,
        ).to.equal('passed');
    }, 30_000);

    it('should report a select that renders no parts', async () => {
        const report = await run(() => <div />);

        expect(failedCheckIds(report)).to.include('contract.dropdown.select.parts');
    }, 30_000);

    it('should check keyboard, focus and dismissal behavior of the conforming select', async () => {
        const report = await run(builtInAtomicSlot('dropdown.select'));

        expect(passedCheckIds(report)).to.include.members([
            'behavior.dropdown.select.keyboard',
            'behavior.dropdown.select.focus',
            'behavior.dropdown.select.dismissal',
        ]);
    }, 30_000);

    it('should report a select that cannot be opened from the keyboard', async () => {
        const report = await run(PointerOnly);

        expect(failedCheckIds(report)).to.include('behavior.dropdown.select.keyboard');
    }, 30_000);
});
