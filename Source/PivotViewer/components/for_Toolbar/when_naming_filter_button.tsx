// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createRef, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { within } from 'storybook/test';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { Toolbar } from '../Toolbar';

let container: HTMLDivElement;
let root: Root;

const render = async (activeFilterCount: number, providerLabel?: string, filtersLabel?: string) => {
    await act(async () => root.render(
        <CratisComponentsProvider value={providerLabel ? { messages: { filter: { label: providerLabel } } } : undefined}>
            <Toolbar
                hasFilters filtersOpen={false} filteredCount={0} viewMode='collection' zoomLevel={1}
                activeDimensionKey='category' dimensions={[{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }]}
                activeFilterCount={activeFilterCount} labels={filtersLabel ? { filters: filtersLabel } : undefined}
                onFiltersToggle={() => undefined} onViewModeChange={() => undefined}
                onZoomIn={() => undefined} onZoomOut={() => undefined}
                onZoomSlider={() => undefined} onZoomReset={() => undefined}
                onZoomChange={() => undefined} onDimensionChange={() => undefined}
                filterButtonRef={createRef<HTMLButtonElement>()}
            />
        </CratisComponentsProvider>,
    ));
    return container.querySelector<HTMLButtonElement>('.pv-filter-icon-button')!;
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

for (const [source, label, providerLabel, filtersLabel] of [
    ['provider', 'Narrow', 'Narrow', undefined],
    ['local override', 'Choose facets', 'Narrow', 'Choose facets'],
    ['default', 'Filters', undefined, undefined],
] as const) {
    describe(`when naming the filter button from the ${source} label`, () => {
        it('should have that accessible name with no active filters', async () => {
            const button = await render(0, providerLabel, filtersLabel);
            expect(within(container).getByRole('button', { name: label })).to.equal(button);
            button.getAttribute('aria-label')!.should.equal(label);
            button.title.should.equal(label);
        });

        it('should keep that accessible name and describe one active filter', async () => {
            const button = await render(1, providerLabel, filtersLabel);
            expect(within(container).getByRole('button', { name: label, description: '1' })).to.equal(button);
            button.getAttribute('aria-describedby')!.should.equal(button.querySelector('.pv-filter-badge')!.id);
            button.title.should.equal(label);
        });
    });
}
