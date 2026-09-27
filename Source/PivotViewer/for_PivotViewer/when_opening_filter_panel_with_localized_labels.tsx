// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { PivotViewer } from '../PivotViewer';

const dimensions = [{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }];
const filters = [{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }];
let container: HTMLDivElement;
let root: Root;
let originalResizeObserver: typeof ResizeObserver;

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
    await act(async () => root.render(<PivotViewer data={[]} dimensions={dimensions} filters={filters}
        cardRenderer={() => ({ title: 'Example item' })}
        labels={{ filters: 'Narrow', search: 'Find items' }} />));
    await act(async () => {
        container.querySelector<HTMLButtonElement>('button[title="Narrow"]')!.click();
    });
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.ResizeObserver = originalResizeObserver;
});

describe('when opening the PivotViewer filter panel with localized labels', () => {
    it('should name the panel with the filter button label', () => {
        expect(document.querySelector('.pv-filter-dropdown')?.getAttribute('aria-label')).to.equal('Narrow');
    });

    it('should use the search label for its placeholder and accessible name', () => {
        const search = document.querySelector<HTMLInputElement>('.pv-filter-dropdown input[type="search"]');
        expect(search?.getAttribute('placeholder')).to.equal('Find items');
        expect(search?.getAttribute('aria-label')).to.equal('Find items');
    });
});
