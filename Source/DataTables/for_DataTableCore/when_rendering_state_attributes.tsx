// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

interface Row {
    id: number;
    name: string;
}

const selectedRow: Row = { id: 1, name: 'Selected row' };
const otherRow: Row = { id: 2, name: 'Other row' };

describe('when rendering DataTable state attributes', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <DataTableCore
                    data={[selectedRow, otherRow]}
                    dataKey='id'
                    emptyMessage='No rows'
                    selectionMode='single'
                    selection={selectedRow}
                >
                    <Column<Row> selectionMode='single' />
                    <Column<Row> field='name' header='Name' sortable />
                </DataTableCore>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const rows = () =>
        Array.from(
            container.querySelectorAll<HTMLTableRowElement>(
                '[data-cratis-part="row"]',
            ),
        );

    it('should expose selection on the selected row and all of its cells', () => {
        const [selected, unselected] = rows();

        expect(selected.getAttribute('data-selected')).to.equal('true');
        for (const cell of selected.querySelectorAll('[data-cratis-part="cell"]')) {
            expect(cell.getAttribute('data-selected')).to.equal('true');
        }
        expect(unselected.hasAttribute('data-selected')).to.equal(false);
        for (const cell of unselected.querySelectorAll('[data-cratis-part="cell"]')) {
            expect(cell.hasAttribute('data-selected')).to.equal(false);
        }
    });

    it('should omit unknown pressed and disabled row and cell states', () => {
        for (const element of container.querySelectorAll(
            '[data-cratis-part="row"], [data-cratis-part="cell"]',
        )) {
            expect(element.hasAttribute('data-pressed')).to.equal(false);
            expect(element.hasAttribute('data-disabled')).to.equal(false);
        }
    });

    it('should omit sort selection before a column is sorted', () => {
        const sort = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="sort"]',
        )!;
        const header = sort.closest('[data-cratis-part="header-cell"]')!;
        const content = sort.closest('[data-cratis-part="header-content"]')!;

        expect(sort.hasAttribute('data-pressed')).to.equal(false);
        expect(header.hasAttribute('data-selected')).to.equal(false);
        expect(content.hasAttribute('data-selected')).to.equal(false);
    });

    it('should expose the selected header and pressed sort control after sorting', async () => {
        const sort = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="sort"]',
        )!;

        await act(async () => sort.click());

        const header = sort.closest('[data-cratis-part="header-cell"]')!;
        const content = sort.closest('[data-cratis-part="header-content"]')!;
        expect(sort.getAttribute('data-pressed')).to.equal('true');
        expect(header.getAttribute('data-selected')).to.equal('true');
        expect(content.getAttribute('data-selected')).to.equal('true');
    });

    it('should never serialize false state attributes', () => {
        expect(container.querySelector('[data-selected="false"]')).to.equal(null);
        expect(container.querySelector('[data-pressed="false"]')).to.equal(null);
        expect(container.querySelector('[data-disabled="false"]')).to.equal(null);
    });
});
