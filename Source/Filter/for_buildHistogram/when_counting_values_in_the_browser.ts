// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildHistogram } from '../utils';

describe('when counting values in the browser', () => {
    const result = buildHistogram([0, 1, 5, 6, 7, 9], 0, 10, 2);

    it('should produce the requested number of buckets', () => {
        result.should.have.lengthOf(2);
    });

    it('should span the range evenly', () => {
        result[0].start.should.equal(0);
        result[0].end.should.equal(5);
        result[1].start.should.equal(5);
        result[1].end.should.equal(10);
    });

    it('should count each value into its bucket', () => {
        result[0].count.should.equal(2);
        result[1].count.should.equal(4);
    });

    it('should report the tallest count so bars can size themselves', () => {
        result.every((bucket) => bucket.maxCount === 4).should.be.true;
    });

    it('should place a value on the upper bound in the last bucket', () => {
        buildHistogram([10], 0, 10, 2)[1].count.should.equal(1);
    });
});

describe('when there is nothing to count', () => {
    it('should produce no buckets for an empty set of values', () => {
        buildHistogram([], 0, 10, 5).should.have.lengthOf(0);
    });

    it('should produce no buckets when the range has no width', () => {
        buildHistogram([5, 5], 5, 5, 5).should.have.lengthOf(0);
    });
});
