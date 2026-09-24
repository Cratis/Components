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
    id: string;
    name: string;
}

const people: Person[] = [
    { id: '1', name: 'Ada' },
    { id: '2', name: 'Grace' },
    { id: '3', name: 'Radia' },
];

describe('when selecting multiple rows', () => {
    let container: HTMLDivElement;
    let root: Root;
    let selected: Person[];

    const render = async (globalFilterFields?: string[]) => {
        await act(async () => {
            root.render(
                <DataTableCore<Person>
                    data={people}
                    dataKey='id'
                    emptyMessage='No people'
                    selectionMode='multiple'
                    selectedItems={selected}
                    onSelectedItemsChange={(items) => {
                        selected = items;
                    }}
                    globalFilterFields={globalFilterFields}
                >
                    <Column<Person> selectionMode='multiple' />
                    <Column<Person> field='name' header='Name' />
                </DataTableCore>,
            );
        });
    };

    const selectAll = () =>
        container.querySelector<HTMLInputElement>('[data-cratis-part="select-all"]')!;
    const rowCheckboxes = () =>
        Array.from(
            container.querySelectorAll<HTMLInputElement>(
                '[data-cratis-part="cell"] input[type="checkbox"]',
            ),
        );

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        selected = [];
        await render();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should render a checkbox per row and a select-all in the header', () => {
        expect(rowCheckboxes()).to.have.lengthOf(3);
        expect(selectAll()).not.to.equal(null);
    });

    it('should report the row when its checkbox is ticked', async () => {
        await act(async () => rowCheckboxes()[1].click());
        expect(selected.map((person) => person.id)).to.deep.equal(['2']);
    });

    it('should report every row when select-all is ticked', async () => {
        await act(async () => selectAll().click());
        expect(selected.map((person) => person.id)).to.deep.equal(['1', '2', '3']);
    });

    it('should clear the selection when select-all is ticked while everything is selected', async () => {
        selected = [...people];
        await render();
        await act(async () => selectAll().click());
        expect(selected).to.have.lengthOf(0);
    });

    it('should show the select-all as indeterminate for a partial selection', async () => {
        selected = [people[0]];
        await render();
        expect(selectAll().indeterminate).to.equal(true);
        expect(selectAll().checked).to.equal(false);
    });

    it('should select only the rows the filter leaves visible', async () => {
        await render(['name']);
        const search = container.querySelector<HTMLInputElement>(
            '[data-cratis-part="search-input"]',
        )!;
        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            )!.set!;
            setValue.call(search, 'Ada');
            search.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await act(async () => selectAll().click());
        expect(selected.map((person) => person.id)).to.deep.equal(['1']);
    });
});
