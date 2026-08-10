// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Column } from 'primereact/column';
import { DataPage, MenuItem } from '../../DataPage';
import { PersonsQuery, resetQueryResult, type Person } from './a_paged_query_result';

/**
 * A `DataPage` mounted into a real document, together with what is needed to
 * take it down again.
 */
export interface DataPageInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Which of `DataPage`'s optional parts a spec wants.
 */
export interface DataPageOptions {
    /** Render a `<DataPage.MenuItems>` action bar. */
    withMenuItems?: boolean;

    /** Supply a `detailsComponent`, so the page runs its split-view branch. */
    withDetails?: boolean;
}

const PersonDetails = ({ item }: { item: Person }) =>
    React.createElement('div', { className: 'person-details' }, item.name);

const columns = () => React.createElement(
    DataPage.Columns,
    { key: 'columns' },
    React.createElement(Column, { key: 'id', field: 'id', header: 'Id' }),
    React.createElement(Column, { key: 'name', field: 'name', header: 'Name' }));

const menuItems = () => React.createElement(
    DataPage.MenuItems,
    { key: 'menuItems' },
    React.createElement(MenuItem, {
        key: 'add',
        label: 'Add',
        icon: () => React.createElement('i', { className: 'pi pi-plus' })
    }));

/**
 * Builds the `DataPage` element the specs render.
 * @param options - {@link DataPageOptions} describing the parts to include.
 * @returns The element.
 */
export const aDataPage = (options: DataPageOptions = {}) => {
    const children = options.withMenuItems ? [menuItems(), columns()] : [columns()];

    return React.createElement(
        DataPage,
        {
            title: 'Persons',
            query: PersonsQuery,
            emptyMessage: 'No persons found',
            dataKey: 'id',
            detailsComponent: options.withDetails ? PersonDetails : undefined
        },
        ...children);
};

/**
 * Renders an element into a real document and lets React settle, so the specs
 * look at the tree a browser would have built.
 *
 * `ResizeObserver` is stubbed because Allotment observes its container for
 * size changes and jsdom has no layout engine to report any.
 * @param element - The element to render.
 * @returns The mounted page, to be passed to {@link unmount}.
 */
export const render = async (element: React.ReactElement): Promise<DataPageInTheDom> => {
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
        root.render(element);
    });

    return { container, root };
};

/**
 * Unmounts a page rendered with {@link render} and removes its container.
 * @param page - The mounted page.
 */
export const unmount = async (page: DataPageInTheDom) => {
    await act(async () => {
        page.root.unmount();
    });
    page.container.remove();
    resetQueryResult();
};

/**
 * Clicks the first data row, which is how a user opens the details pane.
 * @param page - The mounted page.
 */
export const selectFirstRow = async (page: DataPageInTheDom) => {
    const row = page.container.querySelector('tbody tr') as HTMLElement | null;

    await act(async () => {
        row?.click();
    });
};

/**
 * Every layout root the page rendered. There should only ever be one.
 * @param page - The mounted page.
 * @returns The layout roots.
 */
export const layoutRoots = (page: DataPageInTheDom): HTMLElement[] =>
    Array.from(page.container.querySelectorAll<HTMLElement>('.cratis-data-page-layout'));

/**
 * The single layout root of the page.
 * @param page - The mounted page.
 * @returns The layout root.
 */
export const layoutRoot = (page: DataPageInTheDom): HTMLElement => layoutRoots(page)[0];

/**
 * The direct children of the layout root, named by the class that says what
 * each one is and in the order they stack. Rendered elements come from the
 * jsdom realm and carry no `should`, so the shape of the column is described
 * as plain strings the spec can assert on directly — and a failure then says
 * what the column actually held instead of only that two objects differ.
 * @param page - The mounted page.
 * @returns The child roles, top to bottom.
 */
export const layoutRootChildren = (page: DataPageInTheDom): string[] =>
    Array.from(layoutRoot(page).children).map(child => child.className.split(' ')[0]);

/**
 * The action bar, or `null` when the page has no `<DataPage.MenuItems>`.
 * @param page - The mounted page.
 * @returns The action bar.
 */
export const actionBar = (page: DataPageInTheDom): HTMLElement | null =>
    page.container.querySelector<HTMLElement>('.cratis-data-page-actions');

/**
 * The region the data table lives in.
 * @param page - The mounted page.
 * @returns The table region.
 */
export const tableRegion = (page: DataPageInTheDom): HTMLElement =>
    page.container.querySelector<HTMLElement>('.cratis-data-page-table')!;

/**
 * The element the table scrolls in — found by the declaration that makes it
 * scroll rather than by a class, because that is the property the paginator
 * has to stay out of.
 * @param page - The mounted page.
 * @returns The scrolling element.
 */
export const scrollRegion = (page: DataPageInTheDom): HTMLElement =>
    Array.from(page.container.querySelectorAll<HTMLElement>('div')).find(element => element.style.overflow === 'auto')!;

/**
 * The paginator rendered by the data table, or `null` when there is none.
 * @param page - The mounted page.
 * @returns The paginator.
 */
export const paginator = (page: DataPageInTheDom): HTMLElement | null =>
    page.container.querySelector<HTMLElement>('.p-paginator');
