// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import type {
    ColumnFilterElement,
    ColumnFilterElementOptions,
} from '../ColumnFilterMenu';
import type { DataTableFilterMeta } from '../DataTableFilterMeta';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

const onFilter = vi.fn<(filters: DataTableFilterMeta) => void>();

const renderCustomFilter: ColumnFilterElement = (options) => (
    <div data-custom-filter>
        <input data-custom-filter-input readOnly value={String(options.value ?? '')} />
        <button type='button' data-custom-filter-apply onClick={options.onApply}>
            Apply custom
        </button>
        <button type='button' data-custom-filter-clear onClick={options.onClear}>
            Clear custom
        </button>
    </div>
);

describe('when rendering a custom filter element', () => {
    let table: FilterableTableInTheDom;
    let menu: HTMLElement;
    let latestOptions: ColumnFilterElementOptions;

    beforeEach(async () => {
        onFilter.mockClear();
        const filterElement: ColumnFilterElement = (options) => {
            latestOptions = options;
            return renderCustomFilter(options);
        };
        table = await renderFilterableTable({
            defaultFilters: {
                roleCode: { value: 'admin', matchMode: 'equals' },
            },
            onFilter,
            column: {
                field: 'role',
                filterField: 'roleCode',
                header: 'Role',
                filter: true,
                dataType: 'text',
                showFilterMatchModes: false,
                filterElement,
            },
        });
        menu = await openFilterMenu(table);
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    it('should replace the built-in value editor', () => {
        expect(menu.querySelector('[data-custom-filter]')).not.to.equal(null);
        expect(menu.querySelector('[data-scope="inputtext"]')).to.equal(null);
    });

    it('should provide the effective field and current draft', () => {
        expect(latestOptions.field).to.equal('roleCode');
        expect(latestOptions.value).to.equal('admin');
        expect(latestOptions.matchMode).to.equal('equals');
    });

    it('should update and apply the custom draft with one-argument compatibility', async () => {
        await act(async () => latestOptions.onChange('advisor'));
        const apply = menu.querySelector<HTMLButtonElement>('[data-custom-filter-apply]');
        if (!apply) {
            throw new Error('Custom filter did not render its apply action.');
        }
        await act(async () => apply.click());

        expect(onFilter.mock.calls).to.have.lengthOf(1);
        expect(onFilter.mock.calls[0][0].roleCode).to.deep.equal({
            value: 'advisor',
            matchMode: 'equals',
        });
    });

    it('should update the match mode only through its dedicated callback', async () => {
        await act(async () => {
            latestOptions.onChange('advisor', { source: 'user' });
            latestOptions.onMatchModeChange('contains');
        });
        const apply = menu.querySelector<HTMLButtonElement>('[data-custom-filter-apply]');
        if (!apply) throw new Error('Custom filter did not render its apply action.');
        await act(async () => apply.click());

        expect(onFilter.mock.calls[0][0].roleCode).to.deep.equal({
            value: 'advisor',
            matchMode: 'contains',
        });
    });

    it('should store function values without invoking React updater semantics', async () => {
        const functionValue = vi.fn(() => 'computed');
        await act(async () => latestOptions.onChange(functionValue));
        expect(functionValue).not.toHaveBeenCalled();
        expect(latestOptions.value).to.equal(functionValue);
    });
});
