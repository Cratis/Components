// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { Column } from '../../Column';
import { DataTableForQuery } from '../../DataTableForQuery';
import { GeneratedProductsQuery, type Product, ProductsQuery, resetQueryResult } from './a_query_result';

/**
 * A data table mounted into a real document, together with what is needed to
 * take it down again.
 */
export interface DataTableInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Builds the `DataTableForQuery` element the specs render.
 * @returns The element.
 */
export const aDataTable = () => React.createElement(
    DataTableForQuery,
    {
        query: ProductsQuery,
        emptyMessage: 'No products found',
        dataKey: 'id'
    },
    React.createElement(Column, { key: 'id', field: 'id', header: 'Id' }),
    React.createElement(Column, { key: 'name', field: 'name', header: 'Name' }));

/**
 * Builds a `DataTableForQuery` over a proxy shaped like Arc's generated ones (an array-typed
 * data type) while naming the row type explicitly - the form a selectable table needs so its
 * `selection` and `onSelectionChange` are typed to the row rather than to `object`. That this
 * compiles is the point: the generic constraint used to reject it.
 * @param onSelectionChange - Receives the typed selection.
 * @returns The element.
 */
export const aDataTableOverAGeneratedProxy = (onSelectionChange: (product: Product | null) => void) => React.createElement(
    DataTableForQuery<GeneratedProductsQuery, Product, object>,
    {
        query: GeneratedProductsQuery,
        emptyMessage: 'No products found',
        dataKey: 'id',
        onSelectionChange: (event) => onSelectionChange(event.value)
    },
    React.createElement(Column, { key: 'id', field: 'id', header: 'Id' }),
    React.createElement(Column, { key: 'name', field: 'name', header: 'Name' }));

/**
 * Renders an element into a real document and lets React settle.
 *
 * PrimeReact 11 components resolve their configuration from a `PrimeReactProvider` and
 * throw without one, so the element is mounted inside the Cratis provider that supplies
 * it. `ResizeObserver` is stubbed because PrimeReact observes its containers for size
 * changes and jsdom has no layout engine to report any.
 * @param element - The element to render.
 * @returns The mounted table, to be passed to {@link unmount}.
 */
export const render = async (element: React.ReactElement): Promise<DataTableInTheDom> => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(React.createElement(CratisComponentsProvider, null, element));
    });

    return { container, root };
};

/**
 * Unmounts a table rendered with {@link render} and removes its container.
 * @param table - The mounted table.
 */
export const unmount = async (table: DataTableInTheDom) => {
    await act(async () => {
        table.root.unmount();
    });
    table.container.remove();
    resetQueryResult();
};

/**
 * Whether the table rendered its paginator. PrimeReact 11 has no Paginator, so the
 * paging controls are the Cratis `TablePaginator` and carry its own class rather than
 * PrimeReact's `.p-paginator`.
 * @param table - The mounted table.
 * @returns True when a paginator is present.
 */
export const hasPaginator = (table: DataTableInTheDom): boolean =>
    table.container.querySelector('.cratis-table-paginator') !== null;
