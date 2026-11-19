// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    builtInAtomicSlot,
    failedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

const run = (render: ReturnType<typeof builtInAtomicSlot<'dropdown.select'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('dropdown.select', render), 'dropdown.select');

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
});
