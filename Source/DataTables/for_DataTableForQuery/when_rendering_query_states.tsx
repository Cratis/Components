// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableForQuery } from '../DataTableForQuery';
import { type Product, ProductsQuery } from './given/a_query_result';

const queryState = vi.hoisted(() => ({
    data: [] as { id: number; name: string }[],
    isAuthorized: true,
    hasExceptions: false,
    isValid: true,
    isPerforming: false,
}));

vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => [
        {
            ...queryState,
            paging: { page: 0, size: 20, totalItems: 0, totalPages: 0 },
            exceptionMessages: ['Sensitive server exception'],
        },
        () => Promise.resolve(), () => undefined, () => undefined, () => undefined,
    ],
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    queryState.data = [];
    queryState.isAuthorized = true;
    queryState.hasExceptions = false;
    queryState.isValid = true;
    queryState.isPerforming = false;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

const renderTable = async () => {
    await act(async () => {
        root.render(
            <DataTableForQuery<ProductsQuery, Product, object> query={ProductsQuery}
                emptyMessage='No products' loadingMessage='Fetching products'
                failureMessage='Products unavailable' unauthorizedMessage='Products denied'>
                <Column<Product> field='name' header='Name' />
            </DataTableForQuery>,
        );
    });
};

describe('when a snapshot query fails', () => {
    beforeEach(async () => {
        queryState.hasExceptions = true;
        queryState.isPerforming = true;
        await renderTable();
    });
    it('should show the failure rather than the server exception or loading', () => {
        expect(container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent).to.equal('Products unavailable');
        expect(container.textContent).not.to.contain('Sensitive server exception');
    });
});

describe('when a snapshot query is invalid', () => {
    beforeEach(async () => {
        queryState.isValid = false;
        await renderTable();
    });
    it('should show the failure', () => {
        expect(container.querySelector('[data-reason="failed"] [role="alert"]')?.textContent).to.equal('Products unavailable');
    });
});

describe('when a snapshot query is unauthorized', () => {
    beforeEach(async () => {
        queryState.isAuthorized = false;
        queryState.hasExceptions = true;
        await renderTable();
    });
    it('should prioritize authorization over failure', () => {
        expect(container.querySelector('[data-reason="unauthorized"] [role="alert"]')?.textContent).to.equal('Products denied');
    });
});

describe('when a snapshot query is pending', () => {
    beforeEach(async () => {
        queryState.isPerforming = true;
        await renderTable();
    });
    it('should show loading instead of empty', () => {
        expect(container.querySelector('[role="status"]')?.textContent).to.equal('Fetching products');
        expect(container.textContent).not.to.contain('No products');
    });
});

describe('when a snapshot query refetches with rows', () => {
    beforeEach(async () => {
        queryState.isPerforming = true;
        queryState.data = [{ id: 1, name: 'Sample product' }];
        await renderTable();
    });
    it('should retain the rows and mark the table busy', () => {
        expect(container.querySelector('[data-cratis-part="row"]')?.textContent).to.equal('Sample product');
        expect(container.querySelector('table')?.getAttribute('aria-busy')).to.equal('true');
    });
});
