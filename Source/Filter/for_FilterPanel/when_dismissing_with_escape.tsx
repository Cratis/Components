// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';

let container: HTMLDivElement;
let root: Root;
let anchor: HTMLButtonElement;
let outside: HTMLButtonElement;
let onClose: ReturnType<typeof vi.fn>;

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    const anchorRef = createRef<HTMLButtonElement>();
    onClose = vi.fn();
    await act(async () => {
        root.render(<>
            <button ref={anchorRef}>Filters</button>
            <button>Outside</button>
            <FilterPanel isOpen filters={[]} filterValues={{}} rangeValues={{}}
                searchPlaceholder='Search filters' onSearchChange={() => undefined}
                anchorRef={anchorRef} onClose={onClose} onFilterToggle={() => undefined}
                onFilterClear={() => undefined} onRangeChange={() => undefined}
                onExpandedFilterChange={() => undefined} />
        </>);
    });
    anchor = anchorRef.current!;
    outside = container.querySelectorAll('button')[1];
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when pressing Escape inside the panel', () => {
    beforeEach(() => {
        const input = document.querySelector<HTMLInputElement>('.pv-search input')!;
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    it('should close and return focus to the anchor', () => {
        expect(onClose.mock.calls.length).to.equal(1);
        expect(document.activeElement).to.equal(anchor);
    });
});

describe('when pressing Escape on the anchor', () => {
    beforeEach(() => {
        anchor.focus();
        anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    it('should close and retain focus on the anchor', () => {
        expect(onClose.mock.calls.length).to.equal(1);
        expect(document.activeElement).to.equal(anchor);
    });
});

describe('when pressing Escape elsewhere', () => {
    beforeEach(() => {
        outside.focus();
        outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    it('should leave the panel open and focus unchanged', () => {
        expect(onClose.mock.calls.length).to.equal(0);
        expect(document.activeElement).to.equal(outside);
    });
});

describe('when pressing outside the panel', () => {
    beforeEach(async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 1));
        outside.focus();
        outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    it('should close without moving focus', () => {
        expect(onClose.mock.calls.length).to.equal(1);
        expect(document.activeElement).to.equal(outside);
    });
});
