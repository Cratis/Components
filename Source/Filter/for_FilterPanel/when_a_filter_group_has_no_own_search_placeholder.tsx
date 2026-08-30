// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { FilterPanel } from '../FilterPanel';
import type { FilterDefinition } from '../types';

/**
 * Regression coverage for a confirmed bypass: a searchable filter group's inline search box
 * hardcoded its own 'Search...' literal whenever the group did not declare its own
 * `searchPlaceholder`, ignoring the panel-level `searchPlaceholder` prop the caller already
 * supplied for the panel's top search box. A single panel-level override now also reaches an
 * unconfigured group's inline search box; a filter that declares its own `searchPlaceholder`
 * keeps taking priority over both.
 */
describe('when a filter group has no own search placeholder', () => {
    let container: HTMLDivElement;
    let root: Root;

    const filters: FilterDefinition[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'string',
            searchable: true,
            options: [{ key: 'active', label: 'Active', value: 'active' }],
        },
        {
            key: 'role',
            label: 'Role',
            type: 'string',
            searchable: true,
            searchPlaceholder: 'Filter roles placeholder',
            options: [{ key: 'admin', label: 'Admin', value: 'admin' }],
        },
    ];

    const render = async () => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        const anchorRef = createRef<HTMLButtonElement>();

        await act(async () => {
            root.render(
                <FilterPanel
                    isOpen
                    filters={filters}
                    filterValues={{}}
                    rangeValues={{}}
                    searchPlaceholder='Panel-level search placeholder'
                    onSearchChange={() => undefined}
                    anchorRef={anchorRef}
                    onClose={() => undefined}
                    onFilterToggle={() => undefined}
                    onFilterClear={() => undefined}
                    onRangeChange={() => undefined}
                    onExpandedFilterChange={() => undefined}
                />,
            );
        });
    };

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        await render();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const groupSearchInputs = () =>
        Array.from(
            document.querySelectorAll<HTMLInputElement>(
                '.pv-filter-group-search input',
            ),
        );

    it("should fall back to the panel's search placeholder for a group with none of its own", () => {
        expect(groupSearchInputs()[0].placeholder).to.equal(
            'Panel-level search placeholder',
        );
    });

    it('should never fall back to the old hardcoded English literal', () => {
        expect(groupSearchInputs()[0].placeholder).not.to.equal('Search\u2026');
    });

    it("should still prefer the filter's own search placeholder over the panel-level one", () => {
        expect(groupSearchInputs()[1].placeholder).to.equal('Filter roles placeholder');
    });
});
