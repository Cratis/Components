// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PinchSnapshot, pinchSnapshotOf } from '../pinchGesture';

describe('when building a snapshot from a single pointer', () => {
    let result: PinchSnapshot | null;

    beforeEach(() => {
        result = pinchSnapshotOf([{ x: 10, y: 10 }]);
    });

    it('should not describe a pinch', () => expect(result).to.be.null);
});

describe('when building a snapshot from two pointers', () => {
    let result: PinchSnapshot | null;

    beforeEach(() => {
        result = pinchSnapshotOf([{ x: 0, y: 0 }, { x: 60, y: 80 }]);
    });

    it('should place the center at the midpoint', () => {
        result!.center.x.should.equal(30);
        result!.center.y.should.equal(40);
    });

    it('should measure the distance between the pointers', () => result!.distance.should.equal(100));
});

describe('when a third pointer joins an ongoing pinch', () => {
    let result: PinchSnapshot | null;

    beforeEach(() => {
        result = pinchSnapshotOf([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 900, y: 900 }]);
    });

    it('should keep describing the two pointers that started the gesture', () => {
        result!.center.x.should.equal(50);
        result!.center.y.should.equal(0);
        result!.distance.should.equal(100);
    });
});
