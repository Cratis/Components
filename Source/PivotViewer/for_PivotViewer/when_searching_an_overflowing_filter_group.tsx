// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { stubOptionListLayoutMeasurement } from '../../Filter/for_CheckboxListFilter/given/a_checkbox_list_filter_in_the_dom';
import { PivotViewer } from '../PivotViewer';
import type { PivotViewerLabels } from '../PivotViewerLabels';

const dimensions = [{ key: 'status', label: 'Status', getValue: (item: { status: string }) => item.status }];
const filters = [{
    key: 'status',
    label: 'Status',
    getValue: (item: { status: string }) => item.status,
    options: Array.from({ length: 20 }, (_, index) => ({
        key: `status-${index}`,
        label: `Status ${index}`,
        value: `status-${index}`,
        count: 1,
    })),
}];

let container: HTMLDivElement;
let root: Root;
let restoreMeasurement: () => void;
let panelSearch: HTMLInputElement;
let groupSearch: HTMLInputElement;

const renderExpandedGroup = async (labels?: PivotViewerLabels) => {
    await act(async () => root.render(
        <PivotViewer data={[]} dimensions={dimensions} filters={filters}
            cardRenderer={() => ({ title: 'Sample item' })} labels={labels} />,
    ));
    await act(async () => {
        container.querySelector<HTMLButtonElement>('button[title="Filters"]')!.click();
    });
    await act(async () => {
        document.querySelector<HTMLButtonElement>('.pv-filter-toggle')!.click();
    });
    panelSearch = document.querySelector<HTMLInputElement>('.pv-search input')!;
    groupSearch = document.querySelector<HTMLInputElement>('.pv-filter-group-search input')!;
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    restoreMeasurement();
});

describe('when searching an overflowing filter group with default labels', () => {
    beforeEach(async () => {
        await renderExpandedGroup();
    });

    it('should name the group search from its label instead of the panel search', () => {
        expect(panelSearch.getAttribute('aria-label')).to.equal('Search…');
        expect(groupSearch.getAttribute('aria-label')).to.equal('Search Status');
        expect(groupSearch.getAttribute('aria-label')).not.to.equal(panelSearch.getAttribute('aria-label'));
    });

    it('should keep the panel search placeholder on the group search', () => {
        expect(groupSearch.placeholder).to.equal('Search…');
    });
});

describe('when searching an overflowing filter group with localized labels', () => {
    beforeEach(async () => {
        await renderExpandedGroup({ search: 'Find items', searchGroup: (label) => `Find ${label} options` });
    });

    it('should name the group search with the searchGroup formatter instead of the panel search', () => {
        expect(panelSearch.getAttribute('aria-label')).to.equal('Find items');
        expect(groupSearch.getAttribute('aria-label')).to.equal('Find Status options');
        expect(groupSearch.getAttribute('aria-label')).not.to.equal(panelSearch.getAttribute('aria-label'));
    });

    it('should use the panel search placeholder for the group search too', () => {
        expect(groupSearch.placeholder).to.equal('Find items');
    });
});
