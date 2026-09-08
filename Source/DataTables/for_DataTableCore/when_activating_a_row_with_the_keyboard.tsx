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

describe('when activating a row with the keyboard', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onRowClick = vi.fn();
    const onSelectionChange = vi.fn();

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <DataTableCore<Product>
                    data={[{ id: 1, name: 'One' }]}
                    dataKey='id'
                    emptyMessage='No products'
                    selectionMode='single'
                    onRowClick={onRowClick}
                    onSelectionChange={onSelectionChange}
                >
                    <Column<Product> field='name' header='Name' />
                </DataTableCore>,
            );
        });

        const row = container.querySelector<HTMLTableRowElement>(
            '[data-cratis-part="row"]',
        );
        if (!row) throw new Error('DataTableCore did not render its row.');
        row.focus();
        await act(async () => {
            row.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        onRowClick.mockReset();
        onSelectionChange.mockReset();
    });

    it('should make the interactive row keyboard focusable', () => {
        expect(
            container.querySelector<HTMLTableRowElement>('[data-cratis-part="row"]')
                ?.tabIndex,
        ).to.equal(0);
    });

    it('should activate row navigation and selection', () => {
        expect(onRowClick.mock.calls).to.have.lengthOf(1);
        expect(onSelectionChange.mock.calls).to.have.lengthOf(1);
        expect(onSelectionChange.mock.calls[0][0].value).to.deep.equal({
            id: 1,
            name: 'One',
        });
    });
});
