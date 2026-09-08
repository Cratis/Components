// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PinchChange, pinchChangeBetween } from '../pinchGesture';

describe('when the fingers move apart without moving their midpoint', () => {
    let result: PinchChange;

    beforeEach(() => {
        result = pinchChangeBetween(
            { center: { x: 100, y: 100 }, distance: 100 },
            { center: { x: 100, y: 100 }, distance: 150 });
    });

    it('should report the zoom-in', () => result.scale.should.equal(1.5));
    it('should report no pan', () => {
        result.panX.should.equal(0);
        result.panY.should.equal(0);
    });
});

describe('when the fingers keep their spacing and slide across the surface', () => {
    let result: PinchChange;

    beforeEach(() => {
        result = pinchChangeBetween(
            { center: { x: 100, y: 100 }, distance: 100 },
            { center: { x: 130, y: 80 }, distance: 100 });
    });

    it('should report the midpoint movement as the pan', () => {
        result.panX.should.equal(30);
        result.panY.should.equal(-20);
    });

    it('should report no zoom', () => result.scale.should.equal(1));
});

describe('when the fingers come together', () => {
    let result: PinchChange;

    beforeEach(() => {
        result = pinchChangeBetween(
            { center: { x: 0, y: 0 }, distance: 200 },
            { center: { x: 0, y: 0 }, distance: 100 });
    });

    it('should report the zoom-out', () => result.scale.should.equal(0.5));
});

describe('when the previous snapshot had both fingers on the same spot', () => {
    let result: PinchChange;

    beforeEach(() => {
        result = pinchChangeBetween(
            { center: { x: 0, y: 0 }, distance: 0 },
            { center: { x: 0, y: 0 }, distance: 40 });
    });

    it('should not zoom by an unbounded factor', () => result.scale.should.equal(1));
});
