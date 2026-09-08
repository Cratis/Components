// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableForQuery } from '../DataTableForQuery';
import { type Product, ProductsQuery, resetQueryResult } from './given/a_query_result';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('./given/a_query_result');
    return arcQueryHooks();
});

describe('when using the deprecated client filtering prop', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
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
                        emptyMessage='No products'
                        dataKey='id'
                        clientFiltering
                        defaultFilters={{
                            name: { value: 'Product 1', matchMode: 'contains' },
                        }}
                    >
                        <Column<Product> field='id' header='Id' />
                        <Column<Product> field='name' header='Name' />
                    </DataTableForQuery>
                </CratisComponentsProvider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        resetQueryResult();
    });

    it('should keep filtering the currently loaded page', () => {
        expect(container.querySelectorAll('tbody tr')).to.have.lengthOf(11);
    });

    it('should retain the paginator backed by server totals', () => {
        expect(container.querySelector('.cratis-table-paginator')).not.to.equal(null);
    });
});
