// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

describe('when configuring column filter labels', () => {
    let table: FilterableTableInTheDom;
    let menu: HTMLElement;
    let booleanOptions: string[];

    beforeEach(async () => {
        table = await renderFilterableTable({
            column: {
                field: 'role',
                filterField: 'roleCode',
                header: 'Role',
                filter: true,
                dataType: 'boolean',
                showFilterMatchModes: false,
                filterLabels: {
                    filterTriggerAriaLabel: (field) => `Filtrer ${field}`,
                    valueAriaLabel: (field) => `Filterverdi for ${field}`,
                    clear: 'Tøm',
                    apply: 'Bruk',
                    true: 'Ja',
                    false: 'Nei',
                },
            },
        });
        menu = await openFilterMenu(table);

        const booleanTrigger = menu.querySelector<HTMLButtonElement>(
            '[data-cratis-part="trigger"]',
        );
        if (!booleanTrigger) {
            throw new Error('Boolean filter did not render its dropdown.');
        }
        await act(async () => booleanTrigger.click());
        booleanOptions = Array.from(
            document.querySelectorAll('[data-cratis-part="option"]'),
            (option) => option.textContent ?? '',
        );
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    it('should build the trigger label from the effective filter field', () => {
        expect(table.trigger.getAttribute('aria-label')).to.equal('Filtrer roleCode');
    });

    it('should label the filter value control', () => {
        expect(
            menu
                .querySelector('[data-cratis-part="trigger"]')
                ?.getAttribute('aria-label'),
        ).to.equal('Filterverdi for roleCode');
    });

    it('should localize the menu actions', () => {
        const actions = menu.querySelector('.cratis-filter-menu-actions');
        expect(actions?.textContent).to.contain('Tøm');
        expect(actions?.textContent).to.contain('Bruk');
    });

    it('should localize the boolean options', () => {
        expect(booleanOptions).to.deep.equal(['Ja', 'Nei']);
    });
});
