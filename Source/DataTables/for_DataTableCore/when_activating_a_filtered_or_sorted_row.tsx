// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

interface Product {
    id: number;
    name: string;
}

// Sorted-by-name ascending, the loaded page's own index (position in `data`)
// for each row is: Charlie=0, Alpha=1, Bravo=2. Sorting reorders the DOM to
// Alpha, Bravo, Charlie, which would put Alpha's rendered position (0) at odds
// with its loaded-page index (1) if the two were conflated.
const data: Product[] = [
    { id: 1, name: 'Charlie' },
    { id: 2, name: 'Alpha' },
    { id: 3, name: 'Bravo' },
];

describe('when activating a filtered or sorted row', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onRowClick = vi.fn();

    beforeEach(async () => {
        // SAFETY: React's act() environment flag is untyped on globalThis.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <DataTableCore<Product>
                    data={data}
                    dataKey='id'
                    emptyMessage='No products'
                    onRowClick={onRowClick}
                    globalFilterFields={['name']}
                >
                    <Column<Product> field='name' header='Name' sortable />
                </DataTableCore>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        onRowClick.mockReset();
    });

    const rows = () => Array.from(container.querySelectorAll('[data-cratis-part="row"]'));

    it('should report the loaded-page index, not the sorted display position, on click', async () => {
        const sort = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="sort"]',
        )!;
        await act(async () => sort.click());

        // Sorted display order is Alpha, Bravo, Charlie; Alpha is first on screen
        // but is loaded-page index 1 in the original `data` array.
        const alphaRow = rows().find((row) => row.textContent?.includes('Alpha'))!;
        await act(async () => {
            alphaRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(onRowClick.mock.calls).to.have.lengthOf(1);
        expect(onRowClick.mock.calls[0][0]).to.deep.equal({
            data: { id: 2, name: 'Alpha' },
            index: 1,
        });
    });

    it('should report the loaded-page index, not the sorted display position, on keyboard activation', async () => {
        const sort = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="sort"]',
        )!;
        await act(async () => sort.click());

        const alphaRow = rows().find((row) => row.textContent?.includes('Alpha'))!;
        alphaRow.focus();
        await act(async () => {
            alphaRow.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
            );
        });

        expect(onRowClick.mock.calls).to.have.lengthOf(1);
        expect(onRowClick.mock.calls[0][0]).to.deep.equal({
            data: { id: 2, name: 'Alpha' },
            index: 1,
        });
    });

    it('should report the loaded-page index, not the filtered display position, when rows above are filtered out', async () => {
        const search = container.querySelector<HTMLInputElement>(
            '[data-cratis-part="search-input"]',
        )!;
        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            )!.set!;
            setValue.call(search, 'Bravo');
            search.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Bravo is loaded-page index 2, but becomes the only (0th) filtered row.
        const bravoRow = rows()[0];
        expect(bravoRow.textContent).to.contain('Bravo');
        await act(async () => {
            bravoRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });

        expect(onRowClick.mock.calls).to.have.lengthOf(1);
        expect(onRowClick.mock.calls[0][0]).to.deep.equal({
            data: { id: 3, name: 'Bravo' },
            index: 2,
        });
    });
});
