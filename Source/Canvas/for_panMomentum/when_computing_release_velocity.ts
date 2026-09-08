// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PanVelocity, velocityFromSamples } from '../panMomentum';

describe('when computing release velocity from a single sample', () => {
    let result: PanVelocity | null;

    beforeEach(() => {
        result = velocityFromSamples([{ x: 0, y: 0, time: 0 }], 0.02);
    });

    it('should not produce a velocity', () => expect(result).to.be.null);
});

describe('when computing release velocity from a fast drag', () => {
    let result: PanVelocity | null;

    beforeEach(() => {
        result = velocityFromSamples([{ x: 0, y: 0, time: 0 }, { x: 100, y: 50, time: 100 }], 0.02);
    });

    it('should measure horizontal speed', () => result!.x.should.equal(1));

    it('should measure vertical speed', () => result!.y.should.equal(0.5));
});

describe('when computing release velocity from a drag slower than the minimum', () => {
    let result: PanVelocity | null;

    beforeEach(() => {
        result = velocityFromSamples([{ x: 0, y: 0, time: 0 }, { x: 1, y: 0, time: 100 }], 0.02);
    });

    it('should not produce a velocity', () => expect(result).to.be.null);
});

describe('when computing release velocity from samples with no time delta', () => {
    let result: PanVelocity | null;

    beforeEach(() => {
        result = velocityFromSamples([{ x: 0, y: 0, time: 50 }, { x: 100, y: 100, time: 50 }], 0.02);
    });

    it('should not produce a velocity', () => expect(result).to.be.null);
});
