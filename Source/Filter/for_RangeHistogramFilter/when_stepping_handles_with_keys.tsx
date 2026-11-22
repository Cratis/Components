// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { a_rendered_range_histogram, type RenderedRangeHistogram } from './given/a_rendered_range_histogram';

describe('when stepping handles with keys', () => {
    let context: RenderedRangeHistogram;

    beforeEach(async () => {
        context = await a_rendered_range_histogram();
    });

    afterEach(async () => {
        await context.unmount();
    });

    const press = async (handle: 'left' | 'right', key: string) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        await act(async () => {
            context.query(`.pv-range-handle-${handle}`).dispatchEvent(event);
        });
        return event;
    };

    const rangeAfter = async (handle: 'left' | 'right', key: string) => {
        context.onChange.mockClear();
        await press(handle, key);
        return context.onChange.mock.calls[0]?.[0];
    };

    it('should_step_the_minimum_with_arrow_keys', async () => {
        expect(await rangeAfter('left', 'ArrowLeft')).to.deep.equal([10, 80]);
        expect(await rangeAfter('left', 'ArrowDown')).to.deep.equal([10, 80]);
        expect(await rangeAfter('left', 'ArrowUp')).to.deep.equal([30, 80]);
        expect(await rangeAfter('left', 'ArrowRight')).to.deep.equal([30, 80]);
    });

    it('should_step_the_maximum_with_arrow_keys', async () => {
        expect(await rangeAfter('right', 'ArrowLeft')).to.deep.equal([20, 70]);
        expect(await rangeAfter('right', 'ArrowDown')).to.deep.equal([20, 70]);
        expect(await rangeAfter('right', 'ArrowUp')).to.deep.equal([20, 90]);
        expect(await rangeAfter('right', 'ArrowRight')).to.deep.equal([20, 90]);
    });

    it('should_jump_to_the_ends_with_home_and_end', async () => {
        expect(await rangeAfter('left', 'Home')).to.deep.equal([0, 80]);
        expect(await rangeAfter('left', 'End')).to.deep.equal([79, 80]);
        expect(await rangeAfter('right', 'Home')).to.deep.equal([20, 21]);
        expect(await rangeAfter('right', 'End')).to.deep.equal([20, 100]);
    });

    it('should_clamp_steps_to_the_bounds_and_the_minimum_gap', async () => {
        await context.render({ selectedRange: [5, 95] });
        expect(await rangeAfter('left', 'ArrowLeft')).to.deep.equal([0, 95]);
        expect(await rangeAfter('right', 'ArrowRight')).to.deep.equal([5, 100]);
        await context.render({ selectedRange: [50, 55] });
        expect(await rangeAfter('left', 'ArrowRight')).to.deep.equal([54, 55]);
        expect(await rangeAfter('right', 'ArrowLeft')).to.deep.equal([50, 51]);
    });

    it('should_round_stepped_values', async () => {
        await context.render({ min: 0, max: 1, buckets: 10, selectedRange: [0.1, 0.9] });
        expect(await rangeAfter('left', 'ArrowRight')).to.deep.equal([0.2, 0.9]);
    });

    it('should_prevent_the_default_action_for_handled_keys', async () => {
        const event = await press('left', 'ArrowRight');
        expect(event.defaultPrevented).to.equal(true);
    });

    it('should_ignore_other_keys', async () => {
        const event = await press('left', 'Enter');
        expect(event.defaultPrevented).to.equal(false);
        expect(context.onChange.mock.calls).to.have.lengthOf(0);
    });

    it('should_ignore_keys_when_the_bounds_are_empty', async () => {
        await context.render({ min: 10, max: 10, selectedRange: null });
        const event = await press('left', 'ArrowRight');
        expect(event.defaultPrevented).to.equal(false);
        expect(context.onChange.mock.calls).to.have.lengthOf(0);
    });

    it('should_treat_zero_buckets_as_one_step_across_the_bounds', async () => {
        await context.render({ buckets: 0, selectedRange: [20, 80] });
        expect(await rangeAfter('right', 'ArrowLeft')).to.deep.equal([20, 21]);
    });
});
