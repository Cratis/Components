// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type { DataTableFilterMeta } from '../../DataTables/DataTableFilterMeta';
import {
    aDataPage,
    type DataPageInTheDom,
    paginatorRange,
    paginatorTotal,
    render,
    renderedDataRowCount,
    unmount,
} from './given/a_data_page';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('./given/a_paged_query_result');
    return arcQueryHooks();
});

const matchingEveryRow: DataTableFilterMeta = {
    name: { value: 'Person', matchMode: 'contains' },
};

const matchingSomeRows: DataTableFilterMeta = {
    name: { value: 'Person 1', matchMode: 'contains' },
};

const assertFirstPageAndPaginator = (page: DataPageInTheDom) => {
    expect(renderedDataRowCount(page)).to.equal(20);
    expect(paginatorRange(page)).to.equal('1–20');
    expect(paginatorTotal(page)).to.equal(24);
};

describe('when rendered with default filters', () => {
    describe('without a filter value', () => {
        let page: DataPageInTheDom;

        beforeEach(async () => {
            page = await render(aDataPage());
        });

        afterEach(async () => {
            await unmount(page);
        });

        it('should render the first page and paginator', () => {
            assertFirstPageAndPaginator(page);
        });
    });

    describe('with an empty filter map', () => {
        let page: DataPageInTheDom;

        beforeEach(async () => {
            page = await render(aDataPage({ defaultFilters: {} }));
        });

        afterEach(async () => {
            await unmount(page);
        });

        it('should render the first page and paginator', () => {
            assertFirstPageAndPaginator(page);
        });
    });

    describe('with a filter matching every row', () => {
        let page: DataPageInTheDom;

        beforeEach(async () => {
            page = await render(aDataPage({ defaultFilters: matchingEveryRow }));
        });

        afterEach(async () => {
            await unmount(page);
        });

        it('should render the first page and paginator', () => {
            assertFirstPageAndPaginator(page);
        });
    });

    describe('with a selective filter', () => {
        let page: DataPageInTheDom;

        beforeEach(async () => {
            page = await render(aDataPage({ defaultFilters: matchingSomeRows }));
        });

        afterEach(async () => {
            await unmount(page);
        });

        it('should render only matching rows', () => {
            expect(renderedDataRowCount(page)).to.equal(11);
        });
    });
});
