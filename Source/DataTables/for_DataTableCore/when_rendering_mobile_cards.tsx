// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Column } from '../Column';
import { DataTableCore, type DataTableCoreProps } from '../DataTableCore';
import { DataTableStatus } from '../DataTableStatus';
import { DataTableRowProcessing } from '../DataTableRowProcessing';
import { DataTableSortDirection } from '../DataTableSortDirection';
import { aMobileViewport } from './given/a_mobile_viewport';

should();
const data = [{ id: 1, name: 'Example Project' }, { id: 2, name: 'Demo Project' }];
type Row = (typeof data)[number];

describe('when rendering mobile cards', () => {
    let container: HTMLDivElement;
    let root: Root;
    let viewport: ReturnType<typeof aMobileViewport>;
    const activated = vi.fn();
    const selectionChanged = vi.fn();
    const render = async (props: Partial<DataTableCoreProps<Row>> = {}, descending?: string) => {
        await act(async () => root.render(
            <CratisComponentsProvider value={{ messages: { dataTable: { sortDescending: descending } } }}>
            <DataTableCore data={data} dataKey='id' emptyMessage='No rows' mobileLayout='cards' onRowClick={activated} {...props}>
                <Column selectionMode='multiple' />
                <Column selectionMode='multiple' />
                <Column<Row> field='name' header={<strong>Project name</strong>} sortable filter body={row => <><span>{row.name}</span><button>Action</button><a href='#example'>Link</a><input aria-label='Edit name' /><select aria-label='Kind'><option>Example</option></select><textarea aria-label='Notes' /><label><input type='checkbox' />Enabled</label></>} />
                <Column field='missing' />
            </DataTableCore>
            </CratisComponentsProvider>,
        ));
    };
    beforeEach(() => {
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        viewport = aMobileViewport();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
        activated.mockReset();
        selectionChanged.mockReset();
    });

    it('should omit selection marker fields and keep body templates and blank values', async () => {
        await render();
        [...container.querySelectorAll('li dd')].map(value => value.textContent).should.deep.equal([
            'Example ProjectActionLinkExampleEnabled', '', 'Demo ProjectActionLinkExampleEnabled', '',
        ]);
    });
    it('should keep server row order despite a controlled sort and unmatched search', async () => {
        await render({ rowProcessing: DataTableRowProcessing.None, globalFilter: 'Unmatched', globalFilterFields: ['name'], sort: { field: 'name', direction: DataTableSortDirection.Ascending } });
        [...container.querySelectorAll('li dd > span')].map(value => value.textContent).should.deep.equal(data.map(row => row.name));
    });
    it('should provide one select-all and one row checkbox despite repeated markers', async () => {
        await render({ selectionMode: 'multiple' });
        container.querySelectorAll('[data-cratis-part="select-all"], li > input[type="checkbox"]').length.should.equal(3);
    });
    it('should toggle native selection without row activation', async () => {
        await render({ selectionMode: 'multiple', onSelectedItemsChange: selectionChanged });
        await act(async () => container.querySelector<HTMLInputElement>('li > input')!.click());
        activated.mock.calls.length.should.equal(0);
    });
    it('should report native selection once', async () => {
        await render({ selectionMode: 'multiple', onSelectedItemsChange: selectionChanged });
        await act(async () => container.querySelector<HTMLInputElement>('li > input')!.click());
        selectionChanged.mock.calls.should.deep.equal([[ [data[0]] ]]);
    });
    it.each(['button', 'a', 'input', 'select', 'textarea', 'label'])('should not activate through nested %s', async selector => {
        await render();
        await act(async () => container.querySelector<HTMLElement>(`li dd ${selector}`)!.click());
        activated.mock.calls.length.should.equal(0);
    });
    it.each(['Enter', ' '])('should activate a focused card once with %s', async key => {
        await render({ selectionMode: 'single', onSelectionChange: selectionChanged });
        await act(async () => container.querySelector('li')!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
        selectionChanged.mock.calls.length.should.equal(1);
    });
    it('should activate a noninteractive card value once on click', async () => {
        await render();
        await act(async () => container.querySelector<HTMLElement>('li dd > span')!.click());
        activated.mock.calls.length.should.equal(1);
    });
    it('should expose selection with native checked state rather than invalid listitem attributes', async () => {
        await render({ selectionMode: 'single', selection: data[0] });
        container.querySelector<HTMLInputElement>('li > input')!.checked.should.equal(true);
    });
    it('should preserve a focused keyed row across both presentation changes', async () => {
        await render({ selectionMode: 'single' });
        container.querySelector<HTMLElement>('li')!.focus();
        await act(async () => viewport.resize(640));
        await act(async () => viewport.resize(639));
        document.activeElement!.getAttribute('data-datatable-row-key')!.should.equal('identity:1');
    });
    it('should preserve focus outside the replaced presentation', async () => {
        await render({ globalFilterFields: ['name'] });
        const search = container.querySelector<HTMLInputElement>('[data-cratis-part="search-input"]')!;
        search.focus();
        await act(async () => viewport.resize(640));
        (document.activeElement === search).should.equal(true);
    });
    it('should not emit activation callbacks when the viewport changes', async () => {
        await render({ selectionMode: 'single', onSelectionChange: selectionChanged });
        await act(async () => viewport.resize(640));
        await act(async () => viewport.resize(639));
        selectionChanged.mock.calls.length.should.equal(0);
    });
    it('should keep card-specific part attributes separate from table parts', async () => {
        await render({ pt: { card: { title: 'Card detail', className: 'custom-card' }, cell: { title: 'Desktop cell' }, cardValue: { style: { color: 'red' }, title: 'Card value' } } });
        container.querySelectorAll('.custom-card[title="Card detail"] dd[title="Card value"]').length.should.equal(4);
    });
    it('should expose sort direction audibly without aria-sort on listitems', async () => {
        await render({ sort: { field: 'name', direction: DataTableSortDirection.Descending } });
        const description = container.querySelector('[data-cratis-part="sort"]')!.getAttribute('aria-describedby')!;
        document.getElementById(description)!.textContent!.should.equal('Descending');
    });
    it('should localize the associated card sort direction', async () => {
        await render({ sort: { field: 'name', direction: DataTableSortDirection.Descending } }, 'Example descending');
        const description = container.querySelector('[data-cratis-part="sort"]')!.getAttribute('aria-describedby')!;
        document.getElementById(description)!.textContent!.should.equal('Example descending');
    });
    it('should not use table-only selection semantics on listitems', async () => {
        await render({ selectionMode: 'single', selection: data[0] });
        container.querySelectorAll('li[aria-selected], li[aria-sort]').length.should.equal(0);
    });
    it('should let a prevented part event cancel activation', async () => {
        await render({ pt: { card: { onClick: event => event.preventDefault() } } });
        await act(async () => container.querySelector<HTMLElement>('li')!.click());
        activated.mock.calls.length.should.equal(0);
    });
    it('should move lost control focus to the stable root without activating', async () => {
        await render();
        container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]')!.focus();
        await act(async () => viewport.resize(640));
        (document.activeElement === container.querySelector('[data-cratis-component="DataTableCore"]')).should.equal(true);
    });
    it('should use filtered-empty status for unmatched loaded-page search', async () => {
        await render({ globalFilter: 'Unmatched', globalFilterFields: ['name'] });
        container.querySelector('[role="status"]')!.textContent!.should.equal('No rows on this page match the search.');
    });
    it('should retain loaded rows with busy state during refetch', async () => {
        await render({ status: DataTableStatus.Loading });
        container.querySelectorAll('ul[aria-busy="true"] > li').length.should.equal(2);
    });
    it.each([
        [DataTableStatus.Loading, 'status', 'Loading…'],
        [DataTableStatus.Failed, 'alert', 'Could not load data.'],
        [DataTableStatus.Unauthorized, 'alert', 'You are not authorized to view this data.'],
        [DataTableStatus.Ready, 'status', 'No rows'],
    ])('should show %s as a non-table status', async (status, role, message) => {
        await render({ data: [], status: status as DataTableStatus });
        container.querySelector(`[role="${role}"]`)!.textContent!.should.equal(message);
    });
});
