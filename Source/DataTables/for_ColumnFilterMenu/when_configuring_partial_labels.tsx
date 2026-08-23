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

describe('when configuring some column filter labels', () => {
    let table: FilterableTableInTheDom;
    let menu: HTMLElement;

    beforeEach(async () => {
        table = await renderFilterableTable({
            column: {
                field: 'status',
                header: 'Status',
                filter: true,
                filterLabels: {
                    clear: 'Tøm',
                    apply: undefined,
                    filterTriggerAriaLabel: undefined,
                },
            },
        });
        menu = await openFilterMenu(table);
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    it('should preserve omitted default labels', () => {
        expect(table.trigger.getAttribute('aria-label')).to.equal('Filter by status');
        expect(menu.querySelector('.cratis-filter-menu-actions')?.textContent).to.contain(
            'Apply',
        );
    });

    it('should use the supplied label', () => {
        expect(menu.querySelector('.cratis-filter-menu-actions')?.textContent).to.contain(
            'Tøm',
        );
    });
});
