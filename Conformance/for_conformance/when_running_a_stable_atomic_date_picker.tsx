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

const run = (render: ReturnType<typeof builtInAtomicSlot<'display.datePicker'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('display.datePicker', render), 'display.datePicker');

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
});
