// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { cloneElement } from 'react';
import type { TooltipProps } from '@cratis/components/Common';
import { describe, it } from 'vitest';
import {
    builtInAtomicSlot,
    failedCheckIds,
    passedCheckIds,
    libraryWithAtomicSlot,
    runAtomicSlotConformance,
} from './given/a_stable_atomic_slot_library.js';

const run = (render: ReturnType<typeof builtInAtomicSlot<'common.tooltip'>>) =>
    runAtomicSlotConformance(libraryWithAtomicSlot('common.tooltip', render), 'common.tooltip');

// An adapter tooltip that keeps its popup open and never hides it on Escape.
const NeverHides = ({ content, children }: TooltipProps) => (
    <>
        {cloneElement(children, { 'data-cratis-part': 'trigger' })}
        <div role='tooltip' data-cratis-part='popup'>
            {content}
        </div>
    </>
);

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

    it('should check keyboard and dismissal behavior of the conforming tooltip', async () => {
        const report = await run(builtInAtomicSlot('common.tooltip'));

        expect(passedCheckIds(report)).to.include.members([
            'behavior.common.tooltip.keyboard',
            'behavior.common.tooltip.dismissal',
        ]);
    }, 30_000);

    it('should report a tooltip that never hides on Escape', async () => {
        const report = await run(NeverHides);

        expect(failedCheckIds(report)).to.include('behavior.common.tooltip.dismissal');
    }, 30_000);
});
