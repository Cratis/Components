// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore, type DataTableCoreProps } from '../DataTableCore';
import type { DataTableSort } from '../DataTableSort';
import { DataTableSortDirection } from '../DataTableSortDirection';
import { DataTableRowProcessing } from '../DataTableRowProcessing';
import { DataTableFilterMatchMode } from '../DataTableFilterMeta';

interface Product {
    id: number;
    name: string;
}

const data: Product[] = [
    { id: 1, name: 'Charlie' },
    { id: 2, name: 'Alpha' },
    { id: 3, name: 'Bravo' },
];

let container: HTMLDivElement;
let root: Root;
const names = () => Array.from(container.querySelectorAll('tbody tr')).map(row => row.textContent?.trim());
const render = async (props: Partial<DataTableCoreProps<Product>>) => {
    await act(async () => {
        root.render(
            <DataTableCore<Product> data={data} dataKey='id' emptyMessage='None' globalFilterFields={['name']} {...props}>
                <Column<Product> field='name' header='Name' sortable />
            </DataTableCore>,
        );
    });
};
const clickSort = async () => {
    await act(async () => container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]')!.click());
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});
afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when controlling sort and filter state', () => {
    it('should sort by the controlled sort and report header clicks without changing it', async () => {
        const reported: (DataTableSort | null)[] = [];
        await render({ sort: { field: 'name', direction: DataTableSortDirection.Descending }, onSortChange: sort => reported.push(sort) });
        expect(names()).to.deep.equal(['Charlie', 'Bravo', 'Alpha']);
        await clickSort();
        expect(reported).to.deep.equal([{ field: 'name', direction: DataTableSortDirection.Ascending }]);
        expect(names()).to.deep.equal(['Charlie', 'Bravo', 'Alpha']);
    });

    it('should show rows unsorted when the controlled sort is null', async () => {
        await render({ sort: null });
        expect(names()).to.deep.equal(['Charlie', 'Alpha', 'Bravo']);
    });

    it('should keep its own sort and still report it when uncontrolled', async () => {
        const reported: (DataTableSort | null)[] = [];
        await render({ onSortChange: sort => reported.push(sort) });
        await clickSort();
        expect(names()).to.deep.equal(['Alpha', 'Bravo', 'Charlie']);
        expect(reported).to.deep.equal([{ field: 'name', direction: DataTableSortDirection.Ascending }]);
    });

    it('should filter by the controlled search text', async () => {
        await render({ globalFilter: 'bra' });
        expect(names()).to.deep.equal(['Bravo']);
        expect(container.querySelector<HTMLInputElement>('input[type="search"], input')!.value).to.equal('bra');
    });

    it('should filter by the controlled column filters', async () => {
        await render({ filters: { name: { value: 'Alpha', matchMode: DataTableFilterMatchMode.Equals } } });
        expect(names()).to.deep.equal(['Alpha']);
    });

    it('should render rows as given when row processing is off', async () => {
        await render({
            rowProcessing: DataTableRowProcessing.None,
            sort: { field: 'name', direction: DataTableSortDirection.Ascending },
            globalFilter: 'bra',
        });
        expect(names()).to.deep.equal(['Charlie', 'Alpha', 'Bravo']);
    });
});
