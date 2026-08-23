// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableFilterMatchMode } from '../DataTableFilterMeta';
import { DataTableForQuery } from '../DataTableForQuery';
import { type Product, ProductsQuery, resetQueryResult } from './given/a_query_result';

vi.mock('@cratis/arc.react/queries', async () => {
    const { arcQueryHooks } = await import('./given/a_query_result');
    return arcQueryHooks();
});

describe('when using legacy operator filters', () => {
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
                        defaultFilters={{
                            name: {
                                operator: 'or',
                                constraints: [
                                    {
                                        value: 'Product 1',
                                        matchMode: DataTableFilterMatchMode.StartsWith,
                                    },
                                    {
                                        value: 'Product 2',
                                        matchMode: DataTableFilterMatchMode.Equals,
                                    },
                                ],
                            },
                        }}
                    >
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

    it('should apply every constraint using the configured operator', () => {
        expect(container.querySelectorAll('tbody tr')).to.have.lengthOf(12);
    });
});
