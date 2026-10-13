// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { paginatorPages } from '../paginatorPages';

for (const count of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    describe(`when the page count is ${count}`, () => {
        let result: ReturnType<typeof paginatorPages>;
        beforeEach(() => {
            result = paginatorPages(0, count);
        });
        it('should produce no page items', () => {
            result.should.deep.equal([]);
        });
    });
}

for (const scenario of [
    { page: -1, expected: 0 },
    { page: Number.NaN, expected: 0 },
    { page: 100, expected: 11 },
    { page: 5.8, expected: 5 },
]) {
    describe(`when the current page is ${scenario.page}`, () => {
        let result: ReturnType<typeof paginatorPages>;
        beforeEach(() => {
            result = paginatorPages(scenario.page, 12);
        });
        it('should include the normalized current page', () => {
            result.should.deep.contain({ kind: 'page', page: scenario.expected });
        });
    });
}

describe('when window sizes are invalid', () => {
    let result: ReturnType<typeof paginatorPages>;
    beforeEach(() => {
        result = paginatorPages(5, 12, Number.NaN, -1);
    });
    it('should use default siblings and no boundaries', () => {
        result.should.deep.equal([
            { kind: 'ellipsis', key: 'start' },
            { kind: 'page', page: 4 },
            { kind: 'page', page: 5 },
            { kind: 'page', page: 6 },
            { kind: 'ellipsis', key: 'end' },
        ]);
    });
});

describe('when the page count is large', () => {
    let result: ReturnType<typeof paginatorPages>;
    beforeEach(() => {
        result = paginatorPages(500_000, 1_000_000);
    });
    it('should select only the window and boundaries', () => {
        result.should.have.lengthOf(7);
    });
});
