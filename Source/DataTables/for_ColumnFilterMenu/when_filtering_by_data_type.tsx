// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, describe, it, vi } from 'vitest';
import type { DataTableFilterMeta } from '../DataTableFilterMeta';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

const onFilter = vi.fn<(filters: DataTableFilterMeta) => void>();

const type = async (input: HTMLInputElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => {
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

const applyAndRead = async (menu: HTMLElement) => {
    const apply = [...menu.querySelectorAll('button')].find(button => button.textContent === 'Apply')!;
    await act(async () => apply.click());
    return JSON.stringify(onFilter.mock.calls.at(-1)![0]);
};

const open = async (dataType: 'text' | 'numeric' | 'date' | 'boolean') => {
    onFilter.mockClear();
    const table = await renderFilterableTable({
        onFilter,
        column: { field: 'status', header: 'Status', filter: true, dataType, showFilterMatchModes: true },
    });
    return { table, menu: await openFilterMenu(table) };
};

describe('when filtering text', () => {
    let table: FilterableTableInTheDom;
    afterEach(() => unmountFilterableTable(table));

    it('should keep the typed value focused and apply it', async () => {
        const opened = await open('text');
        table = opened.table;
        const input = opened.menu.querySelector<HTMLInputElement>('input.cratis-filter-menu__input')!;
        input.focus();
        await type(input, 'abc');
        expect(opened.menu.querySelector('input.cratis-filter-menu__input')).to.equal(input);
        expect(input.ownerDocument.activeElement).to.equal(input);
        expect(await applyAndRead(opened.menu)).to.contain('"value":"abc"');
    });
});

describe('when filtering numbers', () => {
    let table: FilterableTableInTheDom;
    afterEach(() => unmountFilterableTable(table));

    it('should apply the typed number', async () => {
        const opened = await open('numeric');
        table = opened.table;
        const input = opened.menu.querySelector<HTMLInputElement>('input[type="number"]')!;
        await type(input, '42');
        expect(await applyAndRead(opened.menu)).to.contain('"value":42');
    });

    it('should apply null for an emptied input', async () => {
        const opened = await open('numeric');
        table = opened.table;
        const input = opened.menu.querySelector<HTMLInputElement>('input[type="number"]')!;
        await type(input, '42');
        await type(input, '');
        expect(await applyAndRead(opened.menu)).to.contain('"value":null');
    });
});

describe('when filtering booleans', () => {
    let table: FilterableTableInTheDom;
    afterEach(() => unmountFilterableTable(table));

    it('should offer true and false', async () => {
        const opened = await open('boolean');
        table = opened.table;
        const labels = [...opened.menu.querySelectorAll('option')].map(option => option.textContent?.trim());
        expect(labels).to.include.members(['True', 'False']);
    });
});

describe('when filtering dates', () => {
    let table: FilterableTableInTheDom;
    afterEach(() => unmountFilterableTable(table));

    it('should offer the date match modes', async () => {
        const opened = await open('date');
        table = opened.table;
        const labels = [...opened.menu.querySelectorAll('option')].map(option => option.textContent?.trim());
        expect(labels).to.include.members(['Date is', 'Date is not', 'Before', 'After']);
    });
});
