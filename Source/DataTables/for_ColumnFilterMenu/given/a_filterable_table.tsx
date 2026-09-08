// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
    CratisComponentsProvider,
    type CratisComponentsConfig,
} from '../../../Common/CratisComponentsProvider';
import { Column, type ColumnProps } from '../../Column';
import { DataTableCore } from '../../DataTableCore';
import type { DataTableFilterMeta } from '../../DataTableFilterMeta';

interface Row {
    id: number;
    role: string;
    roleCode: string;
    status: boolean;
}

const rows: Row[] = [
    { id: 1, role: 'Administrator', roleCode: 'admin', status: true },
    { id: 2, role: 'Advisor', roleCode: 'advisor', status: false },
];

export interface FilterableTableOptions {
    column?: ColumnProps<Row>;
    defaultFilters?: DataTableFilterMeta;
    onFilter?: (filters: DataTableFilterMeta) => void;
    /** Overrides the `CratisComponentsProvider` value the table renders under. */
    providerValue?: CratisComponentsConfig;
}

export interface FilterableTableInTheDom {
    container: HTMLDivElement;
    root: Root;
    trigger: HTMLButtonElement;
}

export const renderFilterableTable = async (
    options: FilterableTableOptions = {},
): Promise<FilterableTableInTheDom> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // SAFETY: jsdom omits ResizeObserver; overlay positioning only calls these methods.
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() {
            return undefined;
        }
        unobserve() {
            return undefined;
        }
        disconnect() {
            return undefined;
        }
    };
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const column = {
        field: 'status',
        header: 'Status',
        filter: true,
        dataType: 'boolean',
        showFilterMatchModes: false,
        ...options.column,
    } satisfies ColumnProps<Row>;

    await act(async () => {
        root.render(
            <CratisComponentsProvider value={options.providerValue}>
                <DataTableCore<Row>
                    data={rows}
                    dataKey='id'
                    emptyMessage='No rows'
                    defaultFilters={options.defaultFilters}
                    onFilter={options.onFilter}
                >
                    <Column<Row> {...column} />
                </DataTableCore>
            </CratisComponentsProvider>,
        );
    });

    const trigger = container.querySelector<HTMLButtonElement>('.cratis-filter-trigger');
    if (!trigger) {
        throw new Error('ColumnFilterMenu did not render its trigger.');
    }

    return { container, root, trigger };
};

export const openFilterMenu = async (table: FilterableTableInTheDom) => {
    await act(async () => table.trigger.click());

    const menu = document.querySelector<HTMLElement>('.cratis-filter-menu');
    if (!menu) {
        throw new Error('ColumnFilterMenu did not open its menu.');
    }
    return menu;
};

export const unmountFilterableTable = async (table: FilterableTableInTheDom) => {
    await act(async () => table.root.unmount());
    table.container.remove();
};
