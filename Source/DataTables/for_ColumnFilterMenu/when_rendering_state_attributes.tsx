// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { DataTableFilterMatchMode } from '../DataTableFilterMeta';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

describe('when rendering ColumnFilterMenu state attributes', () => {
    let table: FilterableTableInTheDom;

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    describe('without an applied constraint', () => {
        beforeEach(async () => {
            table = await renderFilterableTable();
        });

        it('should omit inactive trigger states', () => {
            expect(table.trigger.hasAttribute('data-active')).to.equal(false);
            expect(table.trigger.hasAttribute('data-selected')).to.equal(false);
            expect(table.trigger.hasAttribute('data-open')).to.equal(false);
            expect(table.trigger.hasAttribute('data-pressed')).to.equal(false);
            expect(table.trigger.hasAttribute('data-invalid')).to.equal(false);
        });

        it('should expose pressed state while the trigger is pressed', async () => {
            await act(async () => {
                table.trigger.dispatchEvent(
                    new MouseEvent('mousedown', { bubbles: true, buttons: 1 }),
                );
            });

            expect(table.trigger.getAttribute('data-pressed')).to.equal('true');

            await act(async () => {
                document.dispatchEvent(
                    new MouseEvent('mouseup', { bubbles: true, buttons: 0 }),
                );
            });
        });

        it('should expose open state on the trigger, popover, and menu', async () => {
            const menu = await openFilterMenu(table);
            const popover = document.querySelector('[data-cratis-part="filter-popover"]');

            expect(table.trigger.getAttribute('data-open')).to.equal('true');
            expect(popover?.getAttribute('data-open')).to.equal('true');
            expect(menu.getAttribute('data-open')).to.equal('true');
        });

        it('should omit invalid state when no validation state is known', async () => {
            const menu = await openFilterMenu(table);
            const popover = document.querySelector('[data-cratis-part="filter-popover"]');

            expect(table.trigger.hasAttribute('data-invalid')).to.equal(false);
            expect(popover?.hasAttribute('data-invalid')).to.equal(false);
            expect(menu.hasAttribute('data-invalid')).to.equal(false);
        });
    });

    describe('with an applied constraint', () => {
        beforeEach(async () => {
            table = await renderFilterableTable({
                defaultFilters: {
                    status: {
                        value: true,
                        matchMode: DataTableFilterMatchMode.Equals,
                    },
                },
            });
        });

        it('should preserve active and expose selected trigger state', () => {
            expect(table.trigger.getAttribute('data-active')).to.equal('true');
            expect(table.trigger.getAttribute('data-selected')).to.equal('true');
        });

        it('should never serialize false state attributes', async () => {
            await openFilterMenu(table);

            expect(document.querySelector('[data-open="false"]')).to.equal(null);
            expect(document.querySelector('[data-selected="false"]')).to.equal(null);
            expect(document.querySelector('[data-pressed="false"]')).to.equal(null);
            expect(document.querySelector('[data-invalid="false"]')).to.equal(null);
        });
    });
});
