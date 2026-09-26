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

describe('when opening with an expanded autoFocus group', () => {
    beforeEach(async () => {
        await render('second');
    });

    it('should focus the expanded group search', () => {
        expect(document.activeElement).to.equal(document.querySelectorAll('.pv-filter-group-search input')[1]);
    });
});

describe('when opening with a collapsed autoFocus group', () => {
    beforeEach(async () => {
        await render('first');
    });

    it('should leave the collapsed group search mounted without focusing it', () => {
        expect(document.querySelectorAll('.pv-filter-group-search input')).to.have.length(2);
        expect(document.activeElement).not.to.equal(document.querySelectorAll('.pv-filter-group-search input')[1]);
    });

    it('should focus the panel instead of a group without autoFocus', () => {
        expect(document.activeElement).to.equal(document.querySelector('[role="dialog"]'));
    });
});

describe('when expanding an autoFocus group', () => {
    beforeEach(async () => {
        await render('first');
        await render('second');
    });

    it('should focus the newly expanded group search', () => {
        expect(document.activeElement).to.equal(document.querySelectorAll('.pv-filter-group-search input')[1]);
    });
});

describe('when overflow measurement adds search to an expanded autoFocus group', () => {
    let restoreMeasurement: () => void;
    beforeEach(async () => {
        restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
        await render('second', [{ ...filters[1], searchable: undefined }]);
    });
    afterEach(() => restoreMeasurement());

    it('should focus the new search', () => {
        expect(document.activeElement).to.equal(document.querySelector('.pv-filter-group-search input'));
    });
});

describe('when an expanded autoFocus group has no search input', () => {
    beforeEach(async () => {
        await render('second', [{ ...filters[1], searchable: false }]);
    });

    it('should focus the panel instead of an absent search', () => {
        expect(document.activeElement).to.equal(document.querySelector('[role="dialog"]'));
        expect(document.querySelector('.pv-filter-group-search input')).to.equal(null);
    });
});
