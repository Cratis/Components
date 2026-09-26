// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { FilterPanel } from '../FilterPanel';
import type { FilterDefinition } from '../types';
import { stubOptionListLayoutMeasurement } from '../for_CheckboxListFilter/given/a_checkbox_list_filter_in_the_dom';

const filters: FilterDefinition[] = [
    { key: 'first', label: 'First', searchable: true, options: [{ key: 'a', label: 'A', value: 'a' }] },
    { key: 'second', label: 'Second', searchable: true, autoFocus: true, options: [{ key: 'b', label: 'B', value: 'b' }] },
];

describe('when a group requests search auto focus', () => {
    let container: HTMLDivElement;
    let root: Root;
    const anchorRef = createRef<HTMLButtonElement>();
    const render = async (expandedFilterKey: string | null, definitions = filters) => {
        await act(async () => root.render(
            <FilterPanel isOpen filters={definitions} filterValues={{}} rangeValues={{}}
                expandedFilterKey={expandedFilterKey} anchorRef={anchorRef}
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

    it('should focus the expanded group search on open', async () => {
        await render('second');
        expect(document.activeElement).to.equal(document.querySelectorAll('.pv-filter-group-search input')[1]);
    });

    it('should not focus a collapsed group search even though it remains mounted', async () => {
        await render('first');
        expect(document.querySelectorAll('.pv-filter-group-search input')).to.have.length(2);
        expect(document.activeElement).not.to.equal(document.querySelectorAll('.pv-filter-group-search input')[1]);
    });

    it('should focus the group search on expansion', async () => {
        await render('first');
        await render('second');
        expect(document.activeElement).to.equal(document.querySelectorAll('.pv-filter-group-search input')[1]);
    });

    it('should not focus the search of a group without autoFocus', async () => {
        await render('first');
        expect(document.activeElement).not.to.equal(document.querySelectorAll('.pv-filter-group-search input')[0]);
    });

    it('should focus its search after overflow measurement adds the input', async () => {
        const restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
        try {
            await render('second', [{ ...filters[1], searchable: undefined }]);
            expect(document.activeElement).to.equal(document.querySelector('.pv-filter-group-search input'));
        } finally {
            restoreMeasurement();
        }
    });

    it('should not focus a group that has no search input', async () => {
        await render('second', [{ ...filters[1], searchable: false }]);
        expect(document.activeElement).not.to.equal(document.querySelector('.pv-filter-toggle'));
        expect(document.querySelector('.pv-filter-group-search input')).to.equal(null);
    });
});
