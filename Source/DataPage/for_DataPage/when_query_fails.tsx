// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ProductsQuery } from '../../DataTables/for_DataTableForQuery/given/a_query_result';
import { Column } from '../../DataTables/Column';
import { DataPage } from '../DataPage';

const queryState = vi.hoisted(() => ({
    isAuthorized: true,
    hasExceptions: true,
    isPerforming: false,
}));

vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => [
        {
            data: [],
            paging: { page: 0, size: 20, totalItems: 0, totalPages: 0 },
            ...queryState,
            isValid: true,
        },
        () => Promise.resolve(), () => undefined, () => undefined, () => undefined,
    ],
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    queryState.isAuthorized = true;
    queryState.hasExceptions = true;
    queryState.isPerforming = false;
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

const renderPage = async () => {
    await act(async () => {
        root.render(
            <DataPage title='Products' query={ProductsQuery} emptyMessage='No products'
                loadingMessage='Custom page loading' failureMessage='Custom page failure'
                unauthorizedMessage='Custom page denial'>
                <DataPage.Columns><Column field='name' header='Name' /></DataPage.Columns>
            </DataPage>,
        );
    });
};

describe('when a DataPage query fails', () => {
    beforeEach(async () => {
        await renderPage();
    });
    it('should forward the custom failure message to the table', () => {
        expect(container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent).to.equal('Custom page failure');
        expect(container.textContent).not.to.contain('No products');
    });
});

describe('when a DataPage query is loading', () => {
    beforeEach(async () => {
        queryState.hasExceptions = false;
        queryState.isPerforming = true;
        await renderPage();
    });

    it('should forward the custom loading message to the table', () => {
        expect(container.querySelector('[data-cratis-part="loading-row"] [role="status"]')?.textContent).to.equal('Custom page loading');
    });
});

describe('when a DataPage query is unauthorized', () => {
    beforeEach(async () => {
        queryState.isAuthorized = false;
        await renderPage();
    });

    it('should forward the custom unauthorized message to the table', () => {
        expect(container.querySelector('[data-reason="unauthorized"] [role="alert"]')?.textContent).to.equal('Custom page denial');
    });
});
