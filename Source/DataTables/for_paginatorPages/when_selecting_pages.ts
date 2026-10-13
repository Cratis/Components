// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { paginatorPages } from '../paginatorPages';

const pageItems = (...pages: number[]) => pages.map((page) => ({ kind: 'page', page }));

for (const pageCount of [1, 2, 3, 4, 5, 6, 7]) {
    describe(`when selecting from ${pageCount} pages`, () => {
        let result: ReturnType<typeof paginatorPages>;
        beforeEach(() => {
            result = paginatorPages(0, pageCount);
        });
        it('should include every page without an ellipsis', () => {
            result.should.deep.equal(
                pageItems(...Array.from({ length: pageCount }, (_, index) => index)),
            );
        });
    });
}

for (const scenario of [
    {
        name: 'at the start',
        page: 0,
        expected: [
            ...pageItems(0, 1),
            { kind: 'ellipsis', key: 'end' },
            ...pageItems(11),
        ],
    },
    {
        name: 'in the middle',
        page: 5,
        expected: [
            ...pageItems(0),
            { kind: 'ellipsis', key: 'start' },
            ...pageItems(4, 5, 6),
            { kind: 'ellipsis', key: 'end' },
            ...pageItems(11),
        ],
    },
    {
        name: 'at the end',
        page: 11,
        expected: [
            ...pageItems(0),
            { kind: 'ellipsis', key: 'start' },
            ...pageItems(10, 11),
        ],
    },
    {
        name: 'with a one-page start gap',
        page: 3,
        expected: [
            ...pageItems(0, 1, 2, 3, 4),
            { kind: 'ellipsis', key: 'end' },
            ...pageItems(11),
        ],
    },
    {
        name: 'with a one-page end gap',
        page: 8,
        expected: [
            ...pageItems(0),
            { kind: 'ellipsis', key: 'start' },
            ...pageItems(7, 8, 9, 10, 11),
        ],
    },
]) {
    describe(`when selecting pages ${scenario.name}`, () => {
        let result: ReturnType<typeof paginatorPages>;
        beforeEach(() => {
            result = paginatorPages(scenario.page, 12);
        });
        it('should include the current window and boundaries with gaps', () => {
            result.should.deep.equal(scenario.expected);
        });
    });
}

describe('when selecting pages with custom siblings and boundaries', () => {
    let result: ReturnType<typeof paginatorPages>;
    beforeEach(() => {
        result = paginatorPages(9, 20, 2, 2);
    });
    it('should include the requested siblings and boundary pages', () => {
        result.should.deep.equal([
            ...pageItems(0, 1),
            { kind: 'ellipsis', key: 'start' },
            ...pageItems(7, 8, 9, 10, 11),
            { kind: 'ellipsis', key: 'end' },
            ...pageItems(18, 19),
        ]);
    });
});

describe('when selecting pages without siblings or boundaries', () => {
    let result: ReturnType<typeof paginatorPages>;
    beforeEach(() => {
        result = paginatorPages(5, 12, 0, 0);
    });
    it('should retain the current page and both gaps', () => {
        result.should.deep.equal([
            { kind: 'ellipsis', key: 'start' },
            ...pageItems(5),
            { kind: 'ellipsis', key: 'end' },
        ]);
    });
});

describe('when there are no pages', () => {
    let result: ReturnType<typeof paginatorPages>;
    beforeEach(() => {
        result = paginatorPages(0, 0);
    });
    it('should produce no page items', () => {
        result.should.deep.equal([]);
    });
});
