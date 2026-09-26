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
    { key: 'status', label: 'Status', searchable: true, autoFocus: true, options: [{ key: 'active', label: 'Active', value: 'active' }] },
];

const anchorRef = createRef<HTMLButtonElement>();
let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<button ref={anchorRef}>Filters</button>));
    anchorRef.current!.focus();
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

const openPanel = async (expandedFilterKey?: string) => {
    await act(async () => root.render(<>
        <button ref={anchorRef}>Filters</button>
        <FilterPanel isOpen filters={filters} filterValues={{}} rangeValues={{}}
            expandedFilterKey={expandedFilterKey} anchorRef={anchorRef}
            onClose={() => undefined} onFilterToggle={() => undefined}
            onFilterClear={() => undefined} onRangeChange={() => undefined}
            onExpandedFilterChange={() => undefined} />
    </>));
};

describe('when opening a panel without an expanded autoFocus group', () => {
    beforeEach(async () => {
        await openPanel();
    });

    it('should move focus from the anchor into the dialog', () => {
        expect(document.activeElement).to.equal(document.querySelector('[role="dialog"]'));
    });
});

describe('when opening a panel with an expanded autoFocus group', () => {
    beforeEach(async () => {
        await openPanel('status');
    });

    it('should leave focus on the group search input', () => {
        expect(document.activeElement).to.equal(document.querySelector('.pv-filter-group-search input'));
    });
});
