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

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when rendering the default filter panel', () => {
    beforeEach(async () => {
        await render();
    });

    it('should expose a non-modal named dialog rather than a complementary landmark', () => {
        const panel = document.querySelector('.pv-filter-dropdown')!;
        expect(panel.getAttribute('role')).to.equal('dialog');
        expect(panel.getAttribute('aria-modal')).to.equal(null);
        expect(panel.getAttribute('aria-label')).to.equal('Filters');
    });

    it('should render the dialog as a div instead of an aside landmark', () => {
        const panel = document.querySelector('[role="dialog"]');
        expect(panel?.tagName).to.equal('DIV');
    });

    it('should name each group search from its own label or placeholder', () => {
        const inputs = document.querySelectorAll('.pv-filter-group-search input');
        expect(inputs[0].getAttribute('aria-label')).to.equal('Find status');
        expect(inputs[1].getAttribute('aria-label')).to.equal('Find category');
    });
});

describe('when naming the dialog explicitly', () => {
    beforeEach(async () => {
        await render('Choose filters');
    });

    it('should honor the dialog name', () => {
        expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).to.equal('Choose filters');
    });
});

describe('when naming panel search from its placeholder', () => {
    beforeEach(async () => {
        await render(undefined, undefined, 'Find filters');
    });

    it('should use the placeholder', () => {
        expect(document.querySelector('.pv-search input')?.getAttribute('aria-label')).to.equal('Find filters');
    });
});

describe('when naming panel search explicitly', () => {
    beforeEach(async () => {
        await render(undefined, 'Search all filters', 'Find filters');
    });

    it('should honor the separate search name', () => {
        expect(document.querySelector('.pv-search input')?.getAttribute('aria-label')).to.equal('Search all filters');
    });
});

describe('when the panel search placeholder is empty', () => {
    beforeEach(async () => {
        await render(undefined, undefined, '');
    });

    it('should use the English search fallback', () => {
        expect(document.querySelector('.pv-search input')?.getAttribute('aria-label')).to.equal('Search');
    });
});
