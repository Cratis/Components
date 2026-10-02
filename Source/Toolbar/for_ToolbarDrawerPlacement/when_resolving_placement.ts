// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { resolveToolbarDrawerPlacement } from '../ToolbarDrawerPlacement';
import type { ToolbarDrawerPlacementRequest } from '../ToolbarDrawerPlacement';

const request = (overrides: Partial<ToolbarDrawerPlacementRequest>): ToolbarDrawerPlacementRequest => ({
    trigger: { left: 8, top: 300, right: 48, bottom: 340 },
    panel: { width: 300, height: 200 },
    viewport: { width: 1200, height: 800 },
    orientation: 'vertical',
    preferredHorizontalSide: 'right',
    gap: 12,
    margin: 8,
    ...overrides,
});

describe('when resolving the placement of a toolbar drawer', () => {
    it('should open on the preferred side of a vertical toolbar when it fits', () => {
        const placement = resolveToolbarDrawerPlacement(request({}));

        expect(placement.side).to.equal('right');
        expect(placement.shift).to.equal(0);
        expect(placement.mainShift).to.equal(0);
    });

    it('should flip to the other side when the preferred side is too tight', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            trigger: { left: 1150, top: 300, right: 1190, bottom: 340 },
        }));

        expect(placement.side).to.equal('left');
        expect(placement.mainShift).to.equal(0);
    });

    it('should keep the preferred side when neither side fits and it offers more room', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            viewport: { width: 360, height: 800 },
            trigger: { left: 8, top: 300, right: 48, bottom: 340 },
        }));

        expect(placement.side).to.equal('right');
        expect(placement.mainShift).to.be.lessThan(0);
    });

    it('should slide down when the centered drawer would leave the top of the viewport', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            trigger: { left: 8, top: 10, right: 48, bottom: 50 },
        }));

        expect(placement.shift).to.be.greaterThan(0);
        expect(30 - 100 + placement.shift).to.equal(8);
    });

    it('should slide up when the centered drawer would leave the bottom of the viewport', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            trigger: { left: 8, top: 760, right: 48, bottom: 790 },
        }));

        expect(placement.shift).to.be.lessThan(0);
        expect(775 - 100 + placement.shift + 200).to.equal(792);
    });

    it('should bound the height so a drawer taller than the viewport scrolls', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            panel: { width: 300, height: 2000 },
        }));

        expect(placement.maxHeight).to.equal(784);
        expect(placement.shift).to.equal(8 - (320 - 392));
    });

    it('should open below a horizontal toolbar when it fits', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            orientation: 'horizontal',
            trigger: { left: 400, top: 8, right: 440, bottom: 48 },
        }));

        expect(placement.side).to.equal('bottom');
        expect(placement.shift).to.equal(0);
    });

    it('should open above a horizontal toolbar near the bottom edge', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            orientation: 'horizontal',
            trigger: { left: 400, top: 740, right: 440, bottom: 780 },
        }));

        expect(placement.side).to.equal('top');
    });

    it('should keep a horizontal drawer inside the viewport at the left edge', () => {
        const placement = resolveToolbarDrawerPlacement(request({
            orientation: 'horizontal',
            trigger: { left: 8, top: 8, right: 48, bottom: 48 },
        }));

        expect(placement.shift).to.be.greaterThan(0);
    });
});
