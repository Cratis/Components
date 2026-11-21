// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableRow, type DataTableRowProps } from '../DataTableRow';

const row = { id: 1, name: 'Example product' };

describe('when rendering and activating a data table row', () => {
    let container: HTMLDivElement;
    let root: Root;
    let props: DataTableRowProps<typeof row>;
    const onActivate = vi.fn();
    const onToggleSelection = vi.fn();
    const tableRow = () => container.querySelector('tr')!;
    const cells = () => container.querySelectorAll('td');
    const render = async (overrides: Partial<typeof props> = {}) => {
        await act(async () => root.render(
            <table><tbody><DataTableRow {...props} {...overrides} /></tbody></table>,
        ));
    };

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        props = {
            row,
            rowKey: 'example-1',
            selectionMode: 'single',
            columns: [
                <Column key='name' field='name' className='column' bodyClassName='body'
                    style={{ color: 'red', padding: '2px' }} bodyStyle={{ color: 'blue' }} />,
                <Column key='radio' selectionMode='single' />,
                <Column key='checkbox' selectionMode='multiple' />,
                <Column key='custom' body={(product: typeof row) => <strong>{product.id}</strong>} />,
            ],
            isSelected: true,
            isRowSelected: false,
            isInteractive: true,
            resolvedSelectionAriaLabel: 'Select example product',
            selectionGroupName: 'example-selection',
            rowClassName: product => `product-${product.id}`,
            parts: {
                row: { className: 'row-part', tabIndex: 7, title: 'Example row' },
                cell: { className: 'cell-part', style: { color: 'green', margin: '1px' }, title: 'Example cell' },
            },
            onActivate,
            onToggleSelection,
        };
        await render();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        onActivate.mockReset();
        onToggleSelection.mockReset();
    });

    it('should preserve row parts, state, identity, classes and interactive tab order', () => {
        const element = tableRow();
        element.title.should.equal('Example row');
        element.className.should.equal('cratis-datatable__row row-part product-1');
        element.tabIndex.should.equal(0);
        element.getAttribute('aria-selected')!.should.equal('true');
        element.dataset.cratisPart!.should.equal('row');
        element.dataset.datatableRowKey!.should.equal('example-1');
        element.dataset.selected!.should.equal('true');
        element.dataset.interactive!.should.equal('true');
    });

    it('should merge cell parts before column and body styles and render field and body content', () => {
        const cell = cells()[0];
        cell.title.should.equal('Example cell');
        cell.className.should.equal('cratis-datatable__cell cell-part body');
        cell.style.color.should.equal('blue');
        cell.style.padding.should.equal('2px');
        cell.style.margin.should.equal('1px');
        cell.dataset.cratisPart!.should.equal('cell');
        cell.dataset.selected!.should.equal('true');
        cell.textContent!.should.equal(row.name);
        cells()[3].querySelector('strong')!.textContent!.should.equal('1');
    });

    it('should retain radio semantics independently of the multiple-selection state', () => {
        const radio = container.querySelector<HTMLInputElement>('input[type="radio"]')!;
        radio.name.should.equal('example-selection');
        radio.readOnly.should.equal(true);
        radio.tabIndex.should.equal(-1);
        radio.checked.should.equal(true);
        radio.getAttribute('aria-label')!.should.equal('Select example product');
        container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked.should.equal(false);
    });

    it('should toggle the checkbox without activating the row', async () => {
        const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
        await act(async () => checkbox.click());
        onToggleSelection.mock.calls.should.have.lengthOf(1);
        onActivate.mock.calls.should.have.lengthOf(0);
        checkbox.getAttribute('aria-label')!.should.equal('Select example product');
    });

    it('should activate the row once on click', async () => {
        await act(async () => tableRow().click());
        onActivate.mock.calls.should.have.lengthOf(1);
    });

    it.each(['Enter', ' '])('should activate and prevent the default for %s on the row', async key => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        await act(async () => tableRow().dispatchEvent(event));
        onActivate.mock.calls.should.have.lengthOf(1);
        event.defaultPrevented.should.equal(true);
    });

    it.each(['Enter', ' '])('should ignore %s from a nested selection control', async key => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        await act(async () => container.querySelector('input')!.dispatchEvent(event));
        onActivate.mock.calls.should.have.lengthOf(0);
        event.defaultPrevented.should.equal(false);
    });

    it('should leave other row keys to their default behavior', async () => {
        const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
        await act(async () => tableRow().dispatchEvent(event));
        onActivate.mock.calls.should.have.lengthOf(0);
        event.defaultPrevented.should.equal(false);
    });

    it('should retain the consumer tab index and omit inactive state attributes', async () => {
        await render({ isInteractive: false, isSelected: false, isRowSelected: true, selectionMode: 'multiple' });
        tableRow().tabIndex.should.equal(7);
        tableRow().hasAttribute('aria-selected').should.equal(false);
        tableRow().hasAttribute('data-selected').should.equal(false);
        tableRow().hasAttribute('data-interactive').should.equal(false);
        cells()[0].hasAttribute('data-selected').should.equal(false);
        container.querySelector<HTMLInputElement>('input[type="radio"]')!.checked.should.equal(false);
        container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked.should.equal(true);
    });
});
