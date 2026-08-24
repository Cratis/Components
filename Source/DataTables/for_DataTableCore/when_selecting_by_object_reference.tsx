// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

interface Person {
    id?: string;
    name: string;
}

describe('when selecting by object reference', () => {
    const selected: Person = { name: 'Grace' };
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await render([selected, { name: 'Morgan' }], selected);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const render = async (data: Person[], selection: Person, dataKey?: string) => {
        await act(async () => {
            root.render(
                <DataTableCore
                    data={data}
                    dataKey={dataKey}
                    emptyMessage='No people'
                    selectionMode='single'
                    selection={selection}
                    globalFilterFields={['name']}
                >
                    <Column field='name' header='Name' sortable />
                </DataTableCore>,
            );
        });
    };

    const rows = () => Array.from(container.querySelectorAll('[data-cratis-part="row"]'));
    const selectedRows = () =>
        rows().filter((row) => row.getAttribute('aria-selected') === 'true');
    const selectedRow = () =>
        Array.from(container.querySelectorAll('[data-cratis-part="row"]')).find((row) =>
            row.textContent?.includes('Grace'),
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

    it('should_select_only_the_first_occurrence_of_a_repeated_reference', async () => {
        await render([selected, selected], selected);

        expect(rows()).to.have.length(2);
        expect(selectedRows()).to.have.length(1);
    });

    it('should_select_the_exact_row_when_data_keys_are_duplicated', async () => {
        const first = { id: 'same', name: 'First' };
        const second = { id: 'same', name: 'Second' };
        await render([first, second], second, 'id');

        expect(selectedRows()).to.have.length(1);
        expect(selectedRows()[0].textContent).to.contain('Second');
    });

    it('should_select_the_exact_row_when_data_keys_are_missing', async () => {
        const first = { name: 'First' };
        const second = { name: 'Second' };
        await render([first, second], second, 'id');

        expect(selectedRows()).to.have.length(1);
        expect(selectedRows()[0].textContent).to.contain('Second');
    });

    it('should_preserve_selection_after_loaded_page_sorting', async () => {
        const sort = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="sort"]',
        )!;
        await act(async () => sort.click());

        expect(selectedRow()?.getAttribute('aria-selected')).to.equal('true');
    });
});
