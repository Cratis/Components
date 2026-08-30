// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { resolveDropdownPosition } from '../utils';

// The dropdown is `position: fixed` and was previously placed at the anchor's exact
// `bottom`/`left`, so a trigger near the right edge opened a panel that ran off-screen and a
// trigger near the bottom opened one that could not be reached.
const viewport = { width: 1024, height: 768 };

describe('when the filter anchor sits near a viewport edge', () => {
    it('should_keep_a_centred_anchor_aligned_to_its_left_edge', () => {
        const position = resolveDropdownPosition(
            { top: 100, bottom: 130, left: 400 },
            viewport,
        );

        expect(position.left).to.equal(400);
        expect(position.top).to.equal(138);
        expect(position.bottom).to.equal(undefined);
        expect(position.maxHeight).to.equal(614);
    });

    it('should_pull_a_right_edge_anchor_back_inside_the_gutter', () => {
        const position = resolveDropdownPosition(
            { top: 100, bottom: 130, left: 1000 },
            viewport,
        );

        // 1024 viewport - 320 panel - 16 gutter.
        expect(position.left).to.equal(688);
    });

    it('should_never_place_the_panel_left_of_the_gutter', () => {
        const position = resolveDropdownPosition(
            { top: 100, bottom: 130, left: -50 },
            viewport,
        );

        expect(position.left).to.equal(16);
    });

    it('should_anchor_above_without_guessing_the_rendered_panel_height', () => {
        const position = resolveDropdownPosition(
            { top: 700, bottom: 740, left: 200 },
            viewport,
        );

        expect(position.top).to.equal(undefined);
        expect(position.bottom).to.equal(76);
        expect(position.maxHeight).to.equal(640);
    });

    it('should_keep_opening_downwards_while_room_below_is_not_worse', () => {
        const position = resolveDropdownPosition(
            { top: 40, bottom: 70, left: 200 },
            viewport,
        );

        expect(position.top).to.equal(78);
    });

    it('should_stay_inside_a_viewport_narrower_than_the_panel', () => {
        const position = resolveDropdownPosition(
            { top: 10, bottom: 40, left: 200 },
            { width: 240, height: 480 },
        );

        expect(position.left).to.equal(16);
        expect(position.maxHeight).to.be.at.most(448);
    });

    it('should_remain_finite_when_the_viewport_has_not_been_measured_yet', () => {
        const position = resolveDropdownPosition(
            { top: 0, bottom: 0, left: 0 },
            { width: 0, height: 0 },
        );

        expect(position).to.deep.equal({
            top: 0,
            left: 0,
            maxHeight: 0,
        });
    });

    it('should_clamp_an_anchor_that_has_scrolled_below_the_viewport', () => {
        const position = resolveDropdownPosition(
            { top: 900, bottom: 940, left: 200 },
            viewport,
        );

        expect(position.bottom).to.equal(16);
        expect(position.maxHeight).to.equal(640);
    });
});
