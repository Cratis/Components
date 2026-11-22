// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { a_rendered_range_histogram, type RenderedRangeHistogram } from './given/a_rendered_range_histogram';

describe('when dragging the range', () => {
    let context: RenderedRangeHistogram;

    beforeEach(async () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 200,
        } as DOMRect);
        context = await a_rendered_range_histogram();
    });

    afterEach(async () => {
        await context.unmount();
        vi.restoreAllMocks();
    });

    const press = async (selector: string) => {
        await act(async () => {
            context.query(selector).dispatchEvent(
                new MouseEvent('mousedown', { bubbles: true, clientX: 0 }),
            );
        });
    };

    const moveTo = async (clientX: number) => {
        const event = new MouseEvent('mousemove', { bubbles: true, clientX });
        await act(async () => {
            document.dispatchEvent(event);
        });
        return event;
    };

    const release = async () => {
        await act(async () => {
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });
    };

    const ranges = () => context.onChange.mock.calls.map((call) => call[0]);

    it('should_move_the_minimum_and_keep_it_between_the_minimum_and_the_maximum_gap', async () => {
        await press('.pv-range-handle-left');
        await moveTo(20);
        await moveTo(200);
        await moveTo(-100);
        await release();

        expect(ranges()).to.deep.equal([[30, 80], [79, 80], [0, 80]]);
    });

    it('should_move_the_maximum_and_keep_it_between_the_minimum_gap_and_the_maximum', async () => {
        await press('.pv-range-handle-right');
        await moveTo(-200);
        await moveTo(100);
        await moveTo(10);
        await release();

        expect(ranges()).to.deep.equal([[20, 21], [20, 100], [20, 85]]);
    });

    it('should_slide_the_whole_range_and_keep_its_width_inside_the_bounds', async () => {
        await press('.pv-range-selection');
        await moveTo(60);
        await moveTo(-100);
        await moveTo(10);
        await release();

        expect(ranges()).to.deep.equal([[40, 100], [0, 60], [25, 85]]);
    });

    it('should_pass_the_native_mouse_event_as_user_metadata', async () => {
        await press('.pv-range-handle-left');
        const event = await moveTo(20);
        await release();

        expect(context.onChange.mock.calls[0][1]).to.deep.equal({ source: 'user', nativeEvent: event });
    });

    it('should_mark_the_dragged_part_as_pressed_until_released', async () => {
        await press('.pv-range-selection');
        expect(context.query('.pv-range-selection').getAttribute('data-pressed')).to.equal('true');

        await release();
        expect(context.query('.pv-range-selection').hasAttribute('data-pressed')).to.equal(false);
    });

    it('should_stop_following_the_mouse_after_release', async () => {
        await press('.pv-range-handle-left');
        await release();
        await moveTo(20);

        expect(context.onChange.mock.calls).to.have.lengthOf(0);
    });

    it('should_start_from_the_full_bounds_when_nothing_is_selected', async () => {
        await context.render({ selectedRange: null });
        await press('.pv-range-handle-right');
        await moveTo(-20);
        await release();

        expect(ranges()).to.deep.equal([[0, 90]]);
    });
});
