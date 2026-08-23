// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PanSample, trimSamples } from '../panMomentum';

describe('when trimming samples older than the window', () => {
    let result: PanSample[];

    beforeEach(() => {
        result = trimSamples([
            { x: 0, y: 0, time: 0 },
            { x: 10, y: 0, time: 50 },
            { x: 20, y: 0, time: 120 },
        ], 100);
    });

    it('should drop only the samples outside the trailing window', () => {
        result.should.have.lengthOf(2);
        result[0].time.should.equal(50);
        result[1].time.should.equal(120);
    });
});

describe('when trimming a single sample', () => {
    let result: PanSample[];

    beforeEach(() => {
        result = trimSamples([{ x: 0, y: 0, time: 500 }], 100);
    });

    it('should keep the only sample', () => result.should.have.lengthOf(1));
});

describe('when every sample is within the window', () => {
    let result: PanSample[];

    beforeEach(() => {
        result = trimSamples([
            { x: 0, y: 0, time: 0 },
            { x: 10, y: 0, time: 40 },
            { x: 20, y: 0, time: 80 },
        ], 100);
    });

    it('should keep every sample', () => result.should.have.lengthOf(3));
});
