// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { FilterPanel } from '../FilterPanel';
import { FilterEditor } from '../FilterEditor';
import type { FilterDefinition } from '../types';

/**
 * Regression coverage for a confirmed bypass: the header clear buttons for string, range, and
 * custom filter groups set `aria-label` from the caller-supplied `clearFilterAriaLabel` /
 * `clearRangeAriaLabel` props, but hardcoded `title='Clear filter'` / `title='Clear range'`
 * English literals right next to it - so a consumer that localized the accessible name still
 * saw an English tooltip. `title` must mirror the same resolved prop value everywhere it
 * appears, never a separate literal.
 */
describe('when the FilterPanel clear buttons are localized', () => {
    let container: HTMLDivElement;
    let root: Root;

    const filters: FilterDefinition[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'string',
            options: [{ key: 'active', label: 'Active', value: 'active' }],
        },
        {
            key: 'amount',
            label: 'Amount',
            type: 'number',
            numericRange: { min: 0, max: 10, values: [1, 2, 3] },
        },
        {
            key: 'custom',
            label: 'Custom',
            type: 'custom',
        },
    ];

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
                    rangeValues={{ amount: [2, 5] }}
                    customValues={{ custom: 'picked' }}
                    clearFilterAriaLabel='Localized clear filter'
                    clearRangeAriaLabel='Localized clear range'
                    anchorRef={anchorRef}
                    onClose={() => undefined}
                    onFilterToggle={() => undefined}
                    onFilterClear={() => undefined}
                    onRangeChange={() => undefined}
                    onExpandedFilterChange={() => undefined}
                    onCustomValueChange={() => undefined}
                >
                    <FilterEditor filterKey='custom'>
                        {() => <span>custom editor</span>}
                    </FilterEditor>
                </FilterPanel>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const clearButtons = () =>
        Array.from(document.querySelectorAll<HTMLButtonElement>('.pv-filter-clear-header'));

    it('should mirror the localized clear-filter label onto the tooltip for a string filter', () => {
        const button = clearButtons()[0];
        expect(button.title).to.equal('Localized clear filter');
        expect(button.getAttribute('aria-label')).to.equal('Localized clear filter');
    });

    it('should mirror the localized clear-range label onto the tooltip for a numeric filter', () => {
        const button = clearButtons()[1];
        expect(button.title).to.equal('Localized clear range');
        expect(button.getAttribute('aria-label')).to.equal('Localized clear range');
    });

    it('should mirror the localized clear-filter label onto the tooltip for a custom filter', () => {
        const button = clearButtons()[2];
        expect(button.title).to.equal('Localized clear filter');
        expect(button.getAttribute('aria-label')).to.equal('Localized clear filter');
    });

    it('should never fall back to the hardcoded English tooltip literal', () => {
        for (const button of clearButtons()) {
            expect(button.title).not.to.equal('Clear filter');
            expect(button.title).not.to.equal('Clear range');
        }
    });
});
