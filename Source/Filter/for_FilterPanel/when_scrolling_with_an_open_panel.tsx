// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';
import { FilterEditor } from '../FilterEditor';

const anchorRef = createRef<HTMLButtonElement>();
let host: HTMLDivElement;
let root: Root;
let frames: FrameRequestCallback[];
let anchorLeft: number;
let anchorRect: ReturnType<typeof vi.spyOn>;

const noOp = () => undefined;

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    frames = [];
    anchorLeft = 40;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root.render(<>
        <button ref={anchorRef}>Filters</button>
        <FilterPanel isOpen filters={[{
            key: 'options', label: 'Options', multi: true,
            options: Array.from({ length: 30 }, (_, index) => ({ key: `${index}`, label: `Option ${index}`, value: `${index}` })),
        }]} filterValues={{}} rangeValues={{}} expandedFilterKey='options'
            anchorRef={anchorRef} onClose={noOp} onFilterToggle={noOp}
            onFilterClear={noOp} onRangeChange={noOp} onExpandedFilterChange={noOp} />
    </>));
    anchorRect = vi.spyOn(anchorRef.current!, 'getBoundingClientRect').mockImplementation(() =>
        ({ left: anchorLeft, top: 20, right: anchorLeft + 40, bottom: 45, width: 40, height: 25 } as DOMRect));
});

afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    anchorRect.mockRestore();
    vi.unstubAllGlobals();
});

const flushFrame = async () => {
    const callbacks = frames.splice(0);
    await act(async () => callbacks.forEach((callback) => callback(0)));
};

describe('when scrolling with an open filter panel', () => {
    it('coalesces external scrolls, remeasures after the scroll, and skips internal option-list scrolls', async () => {
        const panel = document.querySelector<HTMLElement>('.pv-filter-dropdown')!;
        const optionList = panel.querySelector<HTMLElement>('.pv-option-list')!;
        anchorRect.mockClear();
        anchorLeft = 120;
        await act(async () => {
            for (let index = 0; index < 5; index++) window.dispatchEvent(new Event('scroll'));
        });
        expect(anchorRect.mock.calls.length).to.equal(0);
        expect(frames.length).to.equal(1);
        await flushFrame();
        expect(anchorRect.mock.calls.length).to.equal(1);
        expect(panel.style.left).to.equal('120px');

        anchorRect.mockClear();
        await act(async () => optionList.dispatchEvent(new Event('scroll')));
        expect(frames.length).to.equal(0);
        expect(anchorRect.mock.calls.length).to.equal(0);
    });

    it('avoids a rerender when the measured geometry has not changed', async () => {
        const renderEditor = vi.fn(() => <span>Example editor</span>);
        await act(async () => root.render(<>
            <button ref={anchorRef}>Filters</button>
            <FilterPanel isOpen filters={[{ key: 'custom', label: 'Custom', type: 'custom' }]}
                filterValues={{}} rangeValues={{}} expandedFilterKey='custom'
                anchorRef={anchorRef} onClose={noOp} onFilterToggle={noOp}
                onFilterClear={noOp} onRangeChange={noOp} onExpandedFilterChange={noOp}>
                <FilterEditor filterKey='custom'>{renderEditor}</FilterEditor>
            </FilterPanel>
        </>));
        // First update establishes the mocked anchor's geometry; the next is unchanged.
        frames.splice(0);
        await act(async () => window.dispatchEvent(new Event('scroll')));
        await flushFrame();
        frames.splice(0);
        const rendersBeforeScroll = renderEditor.mock.calls.length;
        await act(async () => window.dispatchEvent(new Event('scroll')));
        await flushFrame();
        expect(renderEditor.mock.calls.length).to.equal(rendersBeforeScroll);
    });
});
