// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { a_rendered_range_histogram, type RenderedRangeHistogram } from './given/a_rendered_range_histogram';

describe('when rendering the histogram', () => {
    let context: RenderedRangeHistogram;

    afterEach(async () => {
        await context.unmount();
    });

    const bars = () => Array.from(context.container.querySelectorAll<HTMLButtonElement>('.pv-histogram-bar'));

    it('should_class_and_size_each_bar_by_its_place_in_the_selection', async () => {
        context = await a_rendered_range_histogram({
            values: [5, 15, 15, 25, 35, 45, 55, 65, 75, 85],
            selectedRange: [15, 45],
        });

        expect(bars().map((bar) => bar.className)).to.deep.equal([
            'pv-histogram-bar  ',
            'pv-histogram-bar  partial',
            'pv-histogram-bar in-range ',
            'pv-histogram-bar in-range ',
            'pv-histogram-bar  partial',
            'pv-histogram-bar  ',
            'pv-histogram-bar  ',
            'pv-histogram-bar  ',
            'pv-histogram-bar  ',
            'pv-histogram-bar  ',
        ]);
        expect(bars().map((bar) => bar.style.height)).to.deep.equal([
            '50%', '100%', '50%', '50%', '50%', '50%', '50%', '50%', '50%', '0%',
        ]);
        expect(bars()[1].title).to.equal('10 - 20: 2 items');
        expect(bars()[1].type).to.equal('button');
    });

    it('should_count_dates_numeric_strings_and_other_convertible_values', async () => {
        context = await a_rendered_range_histogram({
            values: [new Date(15), '25', 'not a number', true, null, undefined, '', 95],
        });

        expect(bars().map((bar) => bar.style.height)).to.deep.equal([
            '100%', '33.33333333333333%', '33.33333333333333%', '0%', '0%', '0%', '0%', '0%', '0%', '33.33333333333333%',
        ]);
    });

    it('should_position_the_selection_and_describe_the_handles', async () => {
        context = await a_rendered_range_histogram({ formatValue: (value) => `#${value}` });

        const selection = context.query('.pv-range-selection');
        const left = context.query('.pv-range-handle-left');
        const right = context.query('.pv-range-handle-right');
        expect(selection.style.left).to.equal('20%');
        expect(selection.style.width).to.equal('60%');
        expect(left.style.left).to.equal('20%');
        expect(right.style.left).to.equal('80%');
        expect([left.getAttribute('aria-valuemin'), left.getAttribute('aria-valuemax'), left.getAttribute('aria-valuenow'), left.getAttribute('aria-valuetext')])
            .to.deep.equal(['0', '79', '20', '#20']);
        expect([right.getAttribute('aria-valuemin'), right.getAttribute('aria-valuemax'), right.getAttribute('aria-valuenow'), right.getAttribute('aria-valuetext')])
            .to.deep.equal(['21', '100', '80', '#80']);
        expect(Array.from(context.container.querySelectorAll('.pv-range-value')).map((label) => label.textContent))
            .to.deep.equal(['#20', '#80']);
    });

    it('should_format_fractions_with_one_decimal_by_default', async () => {
        context = await a_rendered_range_histogram({ selectedRange: [12.345, 80] });

        expect(context.query('.pv-range-value').textContent).to.equal('12.3');
    });

    it('should_place_handles_at_the_start_when_the_bounds_are_empty', async () => {
        context = await a_rendered_range_histogram({ min: 10, max: 10, selectedRange: null });

        expect(bars()).to.have.lengthOf(0);
        expect(context.query('.pv-range-handle-left').style.left).to.equal('0%');
        expect(context.query('.pv-range-handle-right').style.left).to.equal('0%');
        expect(context.query('.pv-range-selection').style.width).to.equal('0%');
    });

    it('should_render_provided_buckets_instead_of_counting_values', async () => {
        context = await a_rendered_range_histogram({
            histogram: [
                { start: 0, end: 50, count: 1 },
                { start: 50, end: 100, count: 4 },
            ],
        });

        expect(bars().map((bar) => bar.style.height)).to.deep.equal(['25%', '100%']);
    });

    it('should_select_a_bar_range_when_a_bar_is_clicked', async () => {
        context = await a_rendered_range_histogram();
        const bar = bars()[2];
        const click = new MouseEvent('click', { bubbles: true });

        await act(async () => {
            bar.dispatchEvent(click);
        });

        expect(context.onChange.mock.calls).to.have.lengthOf(1);
        expect(context.onChange.mock.calls[0][0]).to.deep.equal([20, 30]);
        expect(context.onChange.mock.calls[0][1]).to.deep.equal({ source: 'user', nativeEvent: click });
    });
});
