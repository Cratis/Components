// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { useState } from 'react';
import { describe, it } from 'vitest';
import { atomicSlots as publishedSelect } from '../for_slot_contracts/snippets/select.js';
import {
    builtInAtomicSlot,
    failedCheckIds,
    passedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

const run = (render: ReturnType<typeof builtInAtomicSlot<'dropdown.select'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('dropdown.select', render), 'dropdown.select');

// An adapter select whose trigger is a non-focusable element that reacts to a pointer press only.
const PointerOnly = () => {
    const [open, setOpen] = useState(false);
    return (
        <div data-cratis-part='root'>
            <div
                role='button'
                data-cratis-part='trigger'
                onPointerDown={() => setOpen(!open)}
                onMouseDown={() => setOpen(!open)}
            >
                Choose
            </div>
            {open && <ul role='listbox' data-cratis-part='listbox' />}
        </div>
    );
};

// An adapter select that opens from the keyboard and closes on Escape but never selects with Enter.
const NoKeyboardSelection = () => {
    const [open, setOpen] = useState(false);
    return (
        <div data-cratis-part='root'>
            <button
                type='button'
                data-cratis-part='trigger'
                onClick={() => setOpen(!open)}
                onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
            >
                Choose
            </button>
            {open && (
                <ul role='listbox' data-cratis-part='listbox'>
                    <li role='option' data-cratis-part='option'>
                        Developer
                    </li>
                </ul>
            )}
        </div>
    );
};

// An adapter select that closes on Escape but drops focus instead of returning it to the trigger.
const NoFocusReturn = () => {
    const [open, setOpen] = useState(false);
    return (
        <div data-cratis-part='root'>
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
            >
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

    it('should pass a select whose trigger is a native button operated from the keyboard', async () => {
        const report = await run(publishedSelect['dropdown.select'].render);

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

    it('should report a select that opens but never selects with the keyboard', async () => {
        const report = await run(NoKeyboardSelection);

        expect(failedCheckIds(report)).to.include('behavior.dropdown.select.keyboard');
    }, 30_000);

    it('should report a select that does not return focus to its trigger after Escape', async () => {
        const report = await run(NoFocusReturn);

        expect(failedCheckIds(report)).to.include('behavior.dropdown.select.focus');
    }, 30_000);
});
