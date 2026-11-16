// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, type ReactNode } from 'react';
import { DataPage, Column, type MenuItemProps } from '../../index';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { PersonsQuery, type Person } from './a_paged_query_result';
import type { DataPageInTheDom } from './a_data_page';

export interface MenuPageOptions extends MenuItemProps<Person> {
    selection?: Person | null;
    selectedItems?: Person[];
    selectionMode?: 'single' | 'multiple';
    dataKey?: string;
    onSelectionChange?: (event: { value: Person | null }) => void;
    onSelectedItemsChange?: (items: Person[]) => void;
    children?: ReactNode;
}

export const menuPage = ({ selection, selectedItems, selectionMode, dataKey = 'id',
    onSelectionChange, onSelectedItemsChange, children, ...menu }: MenuPageOptions) => (
    <DataPage query={PersonsQuery} title='People' emptyMessage='No people' dataKey={dataKey}
        selection={selection} selectedItems={selectedItems} selectionMode={selectionMode}
        onSelectionChange={onSelectionChange} onSelectedItemsChange={onSelectedItemsChange}>
        <DataPage.MenuItems><DataPage.MenuItem<Person> label='Act on selection' {...menu} /></DataPage.MenuItems>
        <DataPage.Columns>
            {selectionMode === 'multiple' && <Column<Person> selectionMode='multiple' />}
            <Column<Person> field='name' header='Name' />
        </DataPage.Columns>
        {children}
    </DataPage>
);

export const refreshMenuPage = async (page: DataPageInTheDom, options: MenuPageOptions) => {
    await act(async () => page.root.render(<CratisComponentsProvider>{menuPage(options)}</CratisComponentsProvider>));
};

export const actionButton = (page: DataPageInTheDom) =>
    Array.from(page.container.querySelectorAll<HTMLButtonElement>('button'))
        .find((button) => button.textContent === 'Act on selection')!;

export const selectRow = async (page: DataPageInTheDom, index: number) => {
    const rows = page.container.querySelectorAll<HTMLElement>('[data-cratis-part="row"][aria-selected]');
    await act(async () => rows[index].click());
};

export const toggleRow = async (page: DataPageInTheDom, index: number) => {
    const inputs = page.container.querySelectorAll<HTMLInputElement>('[data-cratis-part="cell"] input[type="checkbox"]');
    await act(async () => inputs[index].click());
};

export const activate = async (page: DataPageInTheDom) => {
    await act(async () => actionButton(page).click());
};
