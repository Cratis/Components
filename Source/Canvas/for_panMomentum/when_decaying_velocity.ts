// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PanVelocity, decayVelocity } from '../panMomentum';

describe('when decaying velocity over time', () => {
    let result: PanVelocity;

    beforeEach(() => {
        result = decayVelocity({ x: 1, y: 2 }, 200, Math.log(2) / 200);
    });

    it('should roughly halve the horizontal component', () => result.x.should.be.closeTo(0.5, 0.001));

    it('should roughly halve the vertical component', () => result.y.should.be.closeTo(1, 0.001));
});

describe('when decaying velocity with no elapsed time', () => {
    let result: PanVelocity;

    beforeEach(() => {
        result = decayVelocity({ x: 1, y: 2 }, 0, 0.0035);
    });

    it('should leave the velocity unchanged', () => {
        result.x.should.equal(1);
        result.y.should.equal(2);
    });
});
