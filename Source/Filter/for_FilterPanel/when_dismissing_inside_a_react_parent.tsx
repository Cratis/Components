// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';

let container: HTMLDivElement;
let root: Root;
const onParentClose = vi.fn();
const onPanelClose = vi.fn();

function Parent() {
    const [panelOpen, setPanelOpen] = useState(true);
    const anchorRef = useRef<HTMLButtonElement>(null);
    return <div onKeyDown={(event) => {
        if (event.key === 'Escape') onParentClose();
    }}>
        <button ref={anchorRef}>Filters</button>
        <FilterPanel isOpen={panelOpen} filters={[]} filterValues={{}} rangeValues={{}}
            onSearchChange={() => undefined} anchorRef={anchorRef}
            onClose={() => { onPanelClose(); setPanelOpen(false); }}
            onFilterToggle={() => undefined} onFilterClear={() => undefined}
            onRangeChange={() => undefined} onExpandedFilterChange={() => undefined} />
    </div>;
}

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    onParentClose.mockReset();
    onPanelClose.mockReset();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<Parent />));
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when pressing Escape in a portaled panel inside a React parent', () => {
    beforeEach(async () => {
        const input = document.querySelector<HTMLInputElement>('.pv-search input')!;
        input.focus();
        await act(async () => {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        });
    });

    it('should close the panel without dismissing the parent', () => {
        expect(onPanelClose.mock.calls.length).to.equal(1);
        expect(onParentClose.mock.calls.length).to.equal(0);
    });
});
