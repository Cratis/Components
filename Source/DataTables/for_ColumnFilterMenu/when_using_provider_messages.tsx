// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

/**
 * Precedence coverage for the `columnFilter` provider message group: a named `filterLabels`
 * override wins, then the provider message, then the English fallback. Also covers the
 * boolean true/false option labels and the match-mode selector's accessible name.
 */
describe('when ColumnFilterMenu uses provider messages', () => {
    let table: FilterableTableInTheDom;
    let menu: HTMLElement;

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    describe('and no filterLabels override is given', () => {
        beforeEach(async () => {
            table = await renderFilterableTable({
                column: {
                    field: 'role',
                    filterField: 'roleCode',
                    header: 'Role',
                    filter: true,
                    dataType: 'boolean',
                    showFilterMatchModes: true,
                },
                providerValue: {
                    messages: {
                        columnFilter: {
                            clear: 'Provider Clear',
                            apply: 'Provider Apply',
                            true: 'Provider True',
                            false: 'Provider False',
                            matchModeAriaLabel: 'Provider Match Mode',
                        },
                    },
                },
            });
            menu = await openFilterMenu(table);
        });

        it('should use the provider clear/apply labels', () => {
            const actions = menu.querySelector('.cratis-filter-menu-actions');
            expect(actions?.textContent).to.contain('Provider Clear');
            expect(actions?.textContent).to.contain('Provider Apply');
        });

        it('should use the provider match-mode accessible name', () => {
            const matchMode = menu.querySelector('[aria-label="Provider Match Mode"]');
            expect(matchMode).not.to.equal(null);
        });
    });

    describe('and a per-instance filterLabels override is also given', () => {
        beforeEach(async () => {
            table = await renderFilterableTable({
                column: {
                    field: 'role',
                    filterField: 'roleCode',
                    header: 'Role',
                    filter: true,
                    dataType: 'boolean',
                    showFilterMatchModes: false,
                    filterLabels: { clear: 'Explicit Clear' },
                },
                providerValue: {
                    messages: {
                        columnFilter: { clear: 'Provider Clear', apply: 'Provider Apply' },
                    },
                },
            });
            menu = await openFilterMenu(table);
        });

        it('should prefer the explicit label over the provider message', () => {
            const actions = menu.querySelector('.cratis-filter-menu-actions');
            expect(actions?.textContent).to.contain('Explicit Clear');
            expect(actions?.textContent).not.to.contain('Provider Clear');
        });

        it('should still fall through to the provider message for a label the instance did not override', () => {
            const actions = menu.querySelector('.cratis-filter-menu-actions');
            expect(actions?.textContent).to.contain('Provider Apply');
        });
    });
});
