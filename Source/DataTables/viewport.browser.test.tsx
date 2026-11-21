// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { should } from 'chai';
import type {} from 'chai/register-should';
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Column } from './Column';
import { DataTableCore } from './DataTableCore';
import { DataTableStatus } from './DataTableStatus';
import './DataTableCore.css';

should();
const rows = [
    { id: 1, name: 'Example Project', notes: 'LongSyntheticContentWithoutBreaksThatMustWrapWithinTheCardWithoutHorizontalViewportOverflow' },
    { id: 2, name: 'Demo Project', notes: '' },
];
const activated = vi.fn();
const bodyAction = vi.fn();

const Example = () => {
    const [selectedItems, setSelectedItems] = useState<typeof rows>([]);
    return <DataTableCore data={rows} dataKey='id' mobileLayout='cards' emptyMessage='No rows' selectionMode='multiple'
        selectedItems={selectedItems} onSelectedItemsChange={setSelectedItems} onRowClick={activated} globalFilterFields={['name']}>
        <Column field='name' header='Project' sortable filter />
        <Column field='notes' header='Notes' />
        <Column header='Action' body={() => <button onClick={bodyAction}>Body action</button>} />
    </DataTableCore>;
};

describe('DataTable viewport presentation', () => {
    let container: HTMLDivElement;
    let root: Root;
    beforeEach(async () => {
        await page.viewport(390, 800);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        root.render(<Example />);
        await vi.waitFor(() => container.querySelectorAll('ul > li').length.should.equal(2));
    });
    afterEach(() => {
        root.unmount();
        container.remove();
        activated.mockReset();
        bodyAction.mockReset();
    });
    it('should render labeled cards without horizontal overflow at phone width', () => {
        (document.documentElement.scrollWidth <= window.innerWidth).should.equal(true);
    });
    it('should retain native selection and transfer its focus through the strict boundary', async () => {
        const checkbox = container.querySelector<HTMLInputElement>('li > input')!;
        checkbox.click();
        checkbox.focus();
        await page.viewport(640, 800);
        await vi.waitFor(() => container.querySelectorAll('table tbody tr').length.should.equal(2));
        await page.viewport(639, 800);
        await vi.waitFor(() => container.querySelectorAll('ul > li').length.should.equal(2));
        (document.activeElement as HTMLInputElement).checked.should.equal(true);
    });
    it('should keep body actions independent from card activation', async () => {
        await page.getByRole('button', { name: 'Body action' }).first().click();
        activated.mock.calls.should.have.lengthOf(0);
    });
    it('should activate the focused card with Space once', async () => {
        container.querySelector<HTMLElement>('li')!.focus();
        await userEvent.keyboard(' ');
        activated.mock.calls.should.have.lengthOf(1);
    });
    it('should keep search focus while the presentation changes', async () => {
        const search = container.querySelector<HTMLInputElement>('[data-cratis-part="search-input"]')!;
        search.focus();
        await page.viewport(640, 800);
        await vi.waitFor(() => container.querySelectorAll('table').length.should.equal(1));
        (document.activeElement === search).should.equal(true);
    });
    it('should keep a localized failure outside table-only markup', async () => {
        root.render(<DataTableCore data={[]} emptyMessage='No rows' mobileLayout='cards' status={DataTableStatus.Failed} failureMessage='Example unavailable'><Column field='name' header='Project' /></DataTableCore>);
        await vi.waitFor(() => container.querySelector('[role="alert"]')!.textContent!.should.equal('Example unavailable'));
    });
});
