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

const run = (render: ReturnType<typeof builtInAtomicSlot<'common.tooltip'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('common.tooltip', render), 'common.tooltip');

describe('when running a stable atomic tooltip', () => {
    it('should exercise and pass a conforming adapter tooltip', async () => {
        const report = await run(builtInAtomicSlot('common.tooltip'));

        expect(failedCheckIds(report)).to.deep.equal([]);
        expect(
            report.checks.find((check) => check.id === 'behavior.common.tooltip')?.status,
        ).to.equal('passed');
    }, 30_000);

    it('should report a tooltip that never renders its popup', async () => {
        const report = await run(({ children }) => children);

        expect(failedCheckIds(report)).to.include('contract.common.tooltip.parts');
    }, 30_000);
});
