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
    {
        key: 'status',
        label: 'Status',
        type: 'string',
        multi: true,
        options: [
            { key: 'active', label: 'Active', value: 'active' },
            { key: 'inactive', label: 'Inactive', value: 'inactive' },
        ],
    },
    {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        numericRange: { min: 0, max: 10, values: [1, 2, 3] },
    },
];

describe('when rendering FilterPanel state attributes', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        const anchorRef = createRef<HTMLButtonElement>();

        await act(async () => {
            root.render(
                <FilterPanel
                    isOpen
                    filters={filters}
                    filterValues={{ status: new Set(['active']) }}
                    rangeValues={{}}
                    expandedFilterKey='status'
                    anchorRef={anchorRef}
                    onClose={() => undefined}
                    onFilterToggle={() => undefined}
                    onFilterClear={() => undefined}
                    onRangeChange={() => undefined}
                    onExpandedFilterChange={() => undefined}
                />,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should expose the open panel state', () => {
        const panel = document.querySelector('.pv-filter-dropdown');

        expect(panel?.getAttribute('data-open')).to.equal('true');
    });

    it('should expose selected and open state on the expanded selected group', () => {
        const group = document.querySelectorAll('.pv-filter')[0];
        const trigger = group.querySelector('.pv-filter-trigger');
        const toggle = group.querySelector('.pv-filter-toggle');
        const content = group.querySelector('.pv-filter-content');

        expect(group.getAttribute('data-selected')).to.equal('true');
        expect(group.getAttribute('data-open')).to.equal('true');
        expect(trigger?.getAttribute('data-selected')).to.equal('true');
        expect(trigger?.getAttribute('data-open')).to.equal('true');
        expect(toggle?.getAttribute('data-selected')).to.equal('true');
        expect(toggle?.getAttribute('data-open')).to.equal('true');
        expect(toggle?.getAttribute('data-pressed')).to.equal('true');
        expect(content?.getAttribute('data-open')).to.equal('true');
    });

    it('should expose selected state only on the selected option', () => {
        const options = document.querySelectorAll('.pv-filter li');
        const selected = options[0];
        const unselected = options[1];

        expect(selected.getAttribute('data-selected')).to.equal('true');
        expect(selected.querySelector('label')?.getAttribute('data-selected')).to.equal(
            'true',
        );
        expect(selected.querySelector('input')?.getAttribute('data-selected')).to.equal(
            'true',
        );
        expect(unselected.hasAttribute('data-selected')).to.equal(false);
        expect(unselected.querySelector('label')?.hasAttribute('data-selected')).to.equal(
            false,
        );
        expect(unselected.querySelector('input')?.hasAttribute('data-selected')).to.equal(
            false,
        );
    });

    it('should omit selected, open, and pressed state from the inactive group', () => {
        const group = document.querySelectorAll('.pv-filter')[1];
        const toggle = group.querySelector('.pv-filter-toggle');
        const content = group.querySelector('.pv-filter-content');

        expect(group.hasAttribute('data-selected')).to.equal(false);
        expect(group.hasAttribute('data-open')).to.equal(false);
        expect(toggle?.hasAttribute('data-selected')).to.equal(false);
        expect(toggle?.hasAttribute('data-open')).to.equal(false);
        expect(toggle?.hasAttribute('data-pressed')).to.equal(false);
        expect(content?.hasAttribute('data-open')).to.equal(false);
    });

    it('should never serialize false state attributes', () => {
        expect(document.querySelector('[data-selected="false"]')).to.equal(null);
        expect(document.querySelector('[data-open="false"]')).to.equal(null);
        expect(document.querySelector('[data-pressed="false"]')).to.equal(null);
    });
});
