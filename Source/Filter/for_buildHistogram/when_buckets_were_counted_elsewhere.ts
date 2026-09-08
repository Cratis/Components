// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildHistogram } from '../utils';
import type { HistogramBucket } from '../types';

/**
 * Pre-counted buckets come from a source that can see more data than the browser holds - a server
 * aggregating over a whole table, for instance. Recounting them against the loaded values would
 * understate the totals and make the picker misrepresent what a range actually selects.
 */
describe('when buckets were counted elsewhere', () => {
    const provided: HistogramBucket[] = [
        { start: 0, end: 5, count: 3000 },
        { start: 5, end: 10, count: 1000 },
    ];
    const result = buildHistogram([1, 2, 3], 0, 10, 20, provided);

    it('should render exactly the buckets it was given', () => {
        result.should.have.lengthOf(2);
    });

    it('should keep the counts it was given rather than recounting the values', () => {
        result[0].count.should.equal(3000);
        result[1].count.should.equal(1000);
    });

    it('should ignore the requested bucket count', () => {
        result.should.not.have.lengthOf(20);
    });

    it('should scale the bars against the tallest provided bucket', () => {
        result.every((bucket) => bucket.maxCount === 3000).should.be.true;
    });

    it('should produce no buckets when given an empty set', () => {
        buildHistogram([1, 2, 3], 0, 10, 20, []).should.have.lengthOf(0);
    });
});
