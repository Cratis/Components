// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';
import { FilterEditor } from '../FilterEditor';

let container: HTMLDivElement;
let root: Root;
let input: HTMLInputElement;
let onClose: ReturnType<typeof vi.fn>;
const anchorRef = createRef<HTMLButtonElement>();

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    onClose = vi.fn();
    await act(async () => root.render(<>
        <button ref={anchorRef}>Filters</button>
        <FilterPanel isOpen filters={[{ key: 'custom', label: 'Custom', type: 'custom' }]}
            filterValues={{}} rangeValues={{}} expandedFilterKey='custom'
            anchorRef={anchorRef} onClose={onClose} onFilterToggle={() => undefined}
            onFilterClear={() => undefined} onRangeChange={() => undefined}
            onExpandedFilterChange={() => undefined}>
            <FilterEditor filterKey='custom'>{() => <input aria-label='Custom filter'
                onKeyDown={(event) => { if (event.key === 'Escape') event.preventDefault(); }} />}</FilterEditor>
        </FilterPanel>
    </>));
    input = document.querySelector<HTMLInputElement>('input[aria-label="Custom filter"]')!;
    input.focus();
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when an inner control prevents Escape', () => {
    beforeEach(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    });

    it('should leave the panel open and focus on the inner control', () => {
        expect(onClose.mock.calls.length).to.equal(0);
        expect(document.activeElement).to.equal(input);
    });
});

describe('when Escape is part of a composition', () => {
    beforeEach(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, isComposing: true }));
    });

    it('should leave the panel open and focus on the inner control', () => {
        expect(onClose.mock.calls.length).to.equal(0);
        expect(document.activeElement).to.equal(input);
    });
});
