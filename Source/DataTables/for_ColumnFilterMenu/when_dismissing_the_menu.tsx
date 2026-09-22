// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import type { ColumnProps } from '../Column';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

const textFilterColumn: ColumnProps = {
    field: 'role',
    header: 'Role',
    filter: true,
    dataType: 'text',
    showFilterMatchModes: false,
};

/** Opens the menu and moves focus onto its value editor, as a keyboard user landing in the popup would. */
const openMenuWithFocusInside = async (table: FilterableTableInTheDom) => {
    await act(async () => table.trigger.focus());
    const menu = await openFilterMenu(table);
    const valueInput = menu.querySelector<HTMLInputElement>('input');
    if (!valueInput) {
        throw new Error('ColumnFilterMenu did not render its value input.');
    }
    await act(async () => valueInput.focus());
    return { menu, valueInput };
};

describe('when dismissing the ColumnFilterMenu', () => {
    let table: FilterableTableInTheDom;

    beforeEach(async () => {
        table = await renderFilterableTable({ column: textFilterColumn });
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    describe('and pressing escape while focus is inside the menu', () => {
        it('should close the menu', async () => {
            const { menu } = await openMenuWithFocusInside(table);

            await act(async () => {
                document.activeElement?.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        key: 'Escape',
                        bubbles: true,
                        cancelable: true,
                    }),
                );
            });

            expect(document.body.contains(menu)).to.equal(false);
        });

        it('should return focus to the trigger that opened it', async () => {
            await openMenuWithFocusInside(table);

            await act(async () => {
                document.activeElement?.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        key: 'Escape',
                        bubbles: true,
                        cancelable: true,
                    }),
                );
            });

            expect(document.activeElement).to.equal(table.trigger);
        });
    });

    describe('and clicking outside the menu', () => {
        const clickOutside = async () => {
            await act(async () => {
                document.body.dispatchEvent(
                    new PointerEvent('pointerdown', { bubbles: true, button: 0 }),
                );
                document.body.dispatchEvent(
                    new MouseEvent('mousedown', { bubbles: true, button: 0 }),
                );
                document.body.dispatchEvent(
                    new MouseEvent('mouseup', { bubbles: true, button: 0 }),
                );
                document.body.dispatchEvent(
                    new PointerEvent('click', { bubbles: true, button: 0 }),
                );
            });
        };

        it('should close the menu', async () => {
            const { menu } = await openMenuWithFocusInside(table);

            await clickOutside();

            expect(document.body.contains(menu)).to.equal(false);
        });

        it('should also return focus to the trigger that opened it', async () => {
            await openMenuWithFocusInside(table);

            await clickOutside();

            expect(document.activeElement).to.equal(table.trigger);
        });
    });

    describe('and pressing Tab while focus is inside the menu', () => {
        it('should keep the menu open, since the menu contains focus rather than dismissing on Tab', async () => {
            const { menu, valueInput } = await openMenuWithFocusInside(table);

            await act(async () => {
                valueInput.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        key: 'Tab',
                        bubbles: true,
                        cancelable: true,
                    }),
                );
            });

            expect(document.body.contains(menu)).to.equal(true);
        });
    });
});
