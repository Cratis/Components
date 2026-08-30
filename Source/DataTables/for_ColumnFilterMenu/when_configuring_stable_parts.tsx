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

describe('when configuring stable column filter parts', () => {
    let table: FilterableTableInTheDom;
    let menu: HTMLElement;

    beforeEach(async () => {
        table = await renderFilterableTable({
            column: {
                field: 'name',
                header: 'Name',
                filter: true,
                filterPt: {
                    trigger: { className: 'product-filter-trigger' },
                    popover: { className: 'product-filter-popover' },
                    menu: { className: 'product-filter-menu' },
                    input: { className: 'product-filter-input' },
                    actions: { className: 'product-filter-actions' },
                    clear: { root: { className: 'product-filter-clear' } },
                    apply: { root: { className: 'product-filter-apply' } },
                },
            },
        });
        menu = await openFilterMenu(table);
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    it('should expose trigger, overlay, menu, input, and action parts', () => {
        expect(table.trigger.classList.contains('product-filter-trigger')).to.equal(
            true,
        );
        expect(document.querySelector('.product-filter-popover')).not.to.equal(null);
        expect(menu.classList.contains('product-filter-menu')).to.equal(true);
        expect(menu.querySelector('.product-filter-input')).not.to.equal(null);
        expect(menu.querySelector('.product-filter-actions')).not.to.equal(null);
        expect(menu.querySelector('.product-filter-clear')).not.to.equal(null);
        expect(menu.querySelector('.product-filter-apply')).not.to.equal(null);
    });
});
