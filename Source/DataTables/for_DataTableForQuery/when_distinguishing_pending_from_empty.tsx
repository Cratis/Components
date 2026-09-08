// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableForQuery } from '../DataTableForQuery';
import { type Product, ProductsQuery } from './given/a_query_result';

const queryState = vi.hoisted(() => ({ isPerforming: true }));

vi.mock('@cratis/arc.react/queries', () => ({
    useQueryWithPaging: () => [
        {
            data: [],
            paging: { page: 0, size: 20, totalItems: 0, totalPages: 0 },
            isPerforming: queryState.isPerforming,
        },
        () => Promise.resolve(),
        () => undefined,
        () => undefined,
        () => undefined,
    ],
}));

let container: HTMLDivElement;
let root: Root;

const renderTable = async () => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
        root.render(
            <CratisComponentsProvider>
                <DataTableForQuery<ProductsQuery, Product, object>
                    query={ProductsQuery}
                    emptyMessage='No products found'
                >
                    <Column<Product> field='name' header='Name' />
                </DataTableForQuery>
            </CratisComponentsProvider>,
        );
    });
};

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when the first query result is pending', () => {
    it('should not render the empty message', async () => {
        queryState.isPerforming = true;
        await renderTable();

        expect(container.textContent).not.to.contain('No products found');
    });
});

describe('when the query has converged empty', () => {
    it('should render the empty message', async () => {
        queryState.isPerforming = false;
        await renderTable();

        expect(container.textContent).to.contain('No products found');
    });
});
