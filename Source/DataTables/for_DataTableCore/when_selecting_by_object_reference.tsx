// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

describe('when selecting by object reference', () => {
    const selected = { name: 'Grace' };
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
                    data={[selected, { name: 'Ada' }]}
                    emptyMessage='No people'
                    selectionMode='single'
                    selection={selected}
                    globalFilterFields={['name']}
                >
                    <Column field='name' header='Name' sortable />
                </DataTableCore>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const selectedRow = () =>
        Array.from(container.querySelectorAll('[data-cratis-part="row"]')).find(
            (row) => row.textContent?.includes('Grace'),
        );

    it('should mark the referenced row selected without a data key', () => {
        expect(selectedRow()?.getAttribute('aria-selected')).to.equal('true');
    });

    it('should_preserve_selection_after_loaded_page_search', async () => {
        const search = container.querySelector<HTMLInputElement>(
            '[data-cratis-part="search-input"]',
        )!;
        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            )!.set!;
            setValue.call(search, 'Grace');
            search.dispatchEvent(new Event('input', { bubbles: true }));
        });

        expect(container.querySelectorAll('[data-cratis-part="row"]')).to.have.length(1);
        expect(selectedRow()?.getAttribute('aria-selected')).to.equal('true');
    });

    it('should_preserve_selection_after_loaded_page_sorting', async () => {
        const sort = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="sort"]',
        )!;
        await act(async () => sort.click());

        expect(selectedRow()?.getAttribute('aria-selected')).to.equal('true');
    });
});
