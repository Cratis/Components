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

const run = (render: ReturnType<typeof builtInAtomicSlot<'common.numberInput'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('common.numberInput', render), 'common.numberInput');

describe('when running a stable atomic number input', () => {
    it('should exercise and pass a conforming adapter number input', async () => {
        const report = await run(builtInAtomicSlot('common.numberInput'));

        expect(failedCheckIds(report)).to.deep.equal([]);
        expect(
            report.checks.find((check) => check.id === 'behavior.common.numberInput')?.status,
        ).to.equal('passed');
    }, 30_000);

    it('should report a number input that renders no parts', async () => {
        const report = await run(() => <div />);

        expect(failedCheckIds(report)).to.include('contract.common.numberInput.parts');
    }, 30_000);
});
