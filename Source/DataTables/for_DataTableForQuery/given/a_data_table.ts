// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Column } from 'primereact/column';
import { DataTableForQuery } from '../../DataTableForQuery';
import { ProductsQuery, resetQueryResult } from './a_query_result';

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
 * Renders an element into a real document and lets React settle.
 * @param element - The element to render.
 * @returns The mounted table, to be passed to {@link unmount}.
 */
export const render = async (element: React.ReactElement): Promise<DataTableInTheDom> => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(element);
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
 * Whether the table rendered its paginator.
 * @param table - The mounted table.
 * @returns True when a paginator is present.
 */
export const hasPaginator = (table: DataTableInTheDom): boolean =>
    table.container.querySelector('.p-paginator') !== null;
