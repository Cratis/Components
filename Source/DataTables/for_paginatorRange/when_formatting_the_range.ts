// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { paginatorRange } from '../paginatorRange';

describe('when formatting the paginator range on the first page', () => {
    it('should report the first page span', () => {
        (paginatorRange(0, 20, 48) ?? '').should.equal('1–20 of 48');
    });
});

describe('when formatting the paginator range on the last partial page', () => {
    it('should clamp the end to the total', () => {
        (paginatorRange(2, 20, 48) ?? '').should.equal('41–48 of 48');
    });
});

describe('when formatting the paginator range with no items', () => {
    it('should return undefined', () => {
        (paginatorRange(0, 20, 0) === undefined).should.be.true;
    });
});

describe('when formatting the paginator range with unknown totals', () => {
    it('should return undefined', () => {
        (paginatorRange(0, undefined, undefined) === undefined).should.be.true;
    });
});
