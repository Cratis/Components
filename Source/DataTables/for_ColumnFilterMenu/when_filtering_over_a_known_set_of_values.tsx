// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type { DataTableFilterMeta } from '../DataTableFilterMeta';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

const onFilter = vi.fn<(filters: DataTableFilterMeta) => void>();

describe('when filtering over a known set of values', () => {
    let table: FilterableTableInTheDom;
    let menu: HTMLElement;

    beforeEach(async () => {
        onFilter.mockClear();
        table = await renderFilterableTable({
            onFilter,
            column: {
                field: 'role',
                filterField: 'roleCode',
                header: 'Role',
                filter: true,
                dataType: 'text',
                showFilterMatchModes: true,
                filterOptions: [
                    { label: 'Administrator', value: 'admin' },
                    { label: 'Advisor', value: 'advisor' },
                ],
            },
        });
        menu = await openFilterMenu(table);
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    it('should offer the values instead of a free-form input', () => {
        expect(menu.querySelector('.cratis-filter-menu__input')).to.equal(null);
    });

    it('should offer every supplied value', () => {
        const labels = [...menu.querySelectorAll('option')].map((option) =>
            option.textContent?.trim(),
        );
        expect(labels).to.contain('Administrator');
        expect(labels).to.contain('Advisor');
    });

    it('should narrow the match modes to equality', () => {
        const labels = [...menu.querySelectorAll('option')].map((option) =>
            option.textContent?.trim(),
        );
        expect(labels).to.contain('Equals');
        expect(labels).to.contain('Not equals');
        expect(labels).not.to.contain('Starts with');
        expect(labels).not.to.contain('Contains');
    });
});
