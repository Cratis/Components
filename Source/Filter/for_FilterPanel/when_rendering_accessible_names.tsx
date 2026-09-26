// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { FilterPanel } from '../FilterPanel';
import type { FilterDefinition } from '../types';

const filters: FilterDefinition[] = [
    { key: 'named', label: 'Named', searchable: true, searchAriaLabel: 'Find status', searchPlaceholder: 'Type a status', options: [{ key: 'a', label: 'Active', value: 'a' }] },
    { key: 'placeholder', label: 'Placeholder', searchable: true, searchPlaceholder: 'Find category', options: [{ key: 'b', label: 'Category', value: 'b' }] },
];

describe('when rendering filter panel accessible names', () => {
    let container: HTMLDivElement;
    let root: Root;
    const anchorRef = createRef<HTMLButtonElement>();
    const render = async (label?: string, searchAriaLabel?: string, searchPlaceholder?: string) => {
        await act(async () => root.render(
            <FilterPanel isOpen filters={filters} filterValues={{}} rangeValues={{}}
                aria-label={label} searchAriaLabel={searchAriaLabel} searchPlaceholder={searchPlaceholder}
                search='' onSearchChange={() => undefined} anchorRef={anchorRef}
                onClose={() => undefined} onFilterToggle={() => undefined}
                onFilterClear={() => undefined} onRangeChange={() => undefined}
                onExpandedFilterChange={() => undefined} />,
        ));
    };

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await render();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should expose a non-modal named dialog rather than a complementary landmark', () => {
        const panel = document.querySelector('.pv-filter-dropdown')!;
        expect(panel.getAttribute('role')).to.equal('dialog');
        expect(panel.getAttribute('aria-modal')).to.equal(null);
        expect(panel.getAttribute('aria-label')).to.equal('Filters');
    });

    it('should honor an explicit dialog name', async () => {
        await render('Choose filters');
        expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).to.equal('Choose filters');
    });

    it('should use the placeholder for the panel search name when no label is given', async () => {
        await render(undefined, undefined, 'Find filters');
        expect(document.querySelector('.pv-search input')?.getAttribute('aria-label')).to.equal('Find filters');
    });

    it('should honor a separate panel search name', async () => {
        await render(undefined, 'Search all filters', 'Find filters');
        expect(document.querySelector('.pv-search input')?.getAttribute('aria-label')).to.equal('Search all filters');
    });

    it('should use English search fallback without a placeholder', async () => {
        await render(undefined, undefined, '');
        expect(document.querySelector('.pv-search input')?.getAttribute('aria-label')).to.equal('Search');
    });

    it('should name each group search from its own label or placeholder', () => {
        const inputs = document.querySelectorAll('.pv-filter-group-search input');
        expect(inputs[0].getAttribute('aria-label')).to.equal('Find status');
        expect(inputs[1].getAttribute('aria-label')).to.equal('Find category');
    });
});
