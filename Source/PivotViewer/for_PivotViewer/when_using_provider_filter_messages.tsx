// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { PivotViewer } from '../PivotViewer';
import type { PivotViewerLabels } from '../PivotViewerLabels';

const dimensions = [{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }];
const filters = [{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }];
let container: HTMLDivElement;
let root: Root;
let originalResizeObserver: typeof ResizeObserver;

const render = async (labels?: PivotViewerLabels) => {
    await act(async () => root.render(
        <CratisComponentsProvider value={{ messages: { filter: { label: 'Narrow', searchAriaLabel: 'Provider search' } } }}>
            <PivotViewer data={[]} dimensions={dimensions} filters={filters}
                cardRenderer={() => ({ title: 'Sample item' })} labels={labels} />
        </CratisComponentsProvider>,
    ));
};

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await render();
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.ResizeObserver = originalResizeObserver;
});

describe('when PivotViewer uses provider filter messages without local labels', () => {
    it('should name the filter button and dialog alike', async () => {
        const button = container.querySelector<HTMLButtonElement>('.pv-filter-icon-button')!;
        expect(button.title).to.equal('Narrow');
        await act(async () => button.click());
        expect(document.querySelector('.pv-filter-dropdown')?.getAttribute('aria-label')).to.equal('Narrow');
    });

    it('should prefer labels.filters for both the button and dialog', async () => {
        await render({ filters: 'Choose facets' });
        const button = container.querySelector<HTMLButtonElement>('.pv-filter-icon-button')!;
        expect(button.title).to.equal('Choose facets');
        await act(async () => button.click());
        expect(document.querySelector('.pv-filter-dropdown')?.getAttribute('aria-label')).to.equal('Choose facets');
    });

    it('should use its own default search placeholder as the explicit panel search name', async () => {
        const button = container.querySelector<HTMLButtonElement>('.pv-filter-icon-button')!;
        await act(async () => button.click());
        const search = document.querySelector<HTMLInputElement>('.pv-filter-dropdown input[type="search"]');
        expect(search?.placeholder).to.equal('Search…');
        expect(search?.getAttribute('aria-label')).to.equal('Search…');
    });
});
