// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import {
    aDataPage,
    type DataPageInTheDom,
    paginatorRange,
    paginatorTotal,
    render,
    renderedDataRowCount,
    unmount,
} from './given/a_data_page';

describe('when rendered with default filters through the query hook', () => {
    let page: DataPageInTheDom;

    beforeEach(async () => {
        page = await render(aDataPage({ defaultFilters: {} }));
    });

    afterEach(async () => {
        await unmount(page);
    });

    it('should render the first page of rows', () => {
        expect(renderedDataRowCount(page)).to.equal(20);
    });

    it('should render the first paginator range', () => {
        expect(paginatorRange(page)).to.equal('1–20');
    });

    it('should report the complete query count', () => {
        expect(paginatorTotal(page)).to.equal(24);
    });
});
