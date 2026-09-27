// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { FilterPanel } from '../FilterPanel';

const anchorRef = createRef<HTMLButtonElement>();
const noOp = () => undefined;
let host: HTMLDivElement;
let root: Root;
let anchorLeft: number;
let anchorBottom: number;
let frames: FrameRequestCallback[];

const panel = () => document.querySelector<HTMLElement>('.pv-filter-dropdown')!;
const renderPanel = (isOpen: boolean, anchorKey: string, inModal = false) => {
    const content = <>
        <FilterPanel isOpen={isOpen} filters={[]} filterValues={{}} rangeValues={{}}
            anchorRef={anchorRef} onClose={noOp} onFilterToggle={noOp}
            onFilterClear={noOp} onRangeChange={noOp} onExpandedFilterChange={noOp} />
        <button key={anchorKey} ref={anchorRef} type='button'>Filters</button>
    </>;
    return inModal
        ? <div className='cratis-dialog__positioner' data-cratis-part='positioner'>
            <section className='cratis-dialog' data-cratis-part='root' data-placement='end'>{content}</section>
        </div>
        : content;
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    anchorLeft = 120;
    anchorBottom = 80;
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        if (this === anchorRef.current) {
            return { left: anchorLeft, top: anchorBottom - 24, right: anchorLeft + 40,
                bottom: anchorBottom, width: 40, height: 24 } as DOMRect;
        }
        return { left: 0, top: 0, right: 1, bottom: 0, width: 1, height: 1 } as DOMRect;
    });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const flushFrame = async () => {
    const pending = frames.splice(0);
    await act(async () => pending.forEach((callback) => callback(0)));
};

const expectAnchorPosition = () => {
    expect(panel()).not.to.equal(null);
    expect(panel().style.left).to.equal(`${anchorLeft}px`);
    expect(panel().style.top).to.equal(`${anchorBottom + 8}px`);
    expect(Number.parseFloat(panel().style.maxHeight)).to.be.greaterThan(0);
};

describe('when positioning a panel before its anchor in the React tree', () => {
    it('measures an initially open panel as soon as the portal mounts, without a scroll or resize', async () => {
        await act(async () => root.render(renderPanel(true, 'first')));
        expectAnchorPosition();
    });

    it('measures a newly attached anchor when it is replaced during opening, without a scroll or resize', async () => {
        await act(async () => root.render(renderPanel(false, 'first')));
        const firstAnchor = anchorRef.current;
        anchorLeft = 240;
        anchorBottom = 150;
        await act(async () => root.render(renderPanel(true, 'second')));
        expect(anchorRef.current).not.to.equal(firstAnchor);
        expectAnchorPosition();
    });
});

describe('when a side modal finishes a custom animation', () => {
    it('remeasures for a custom animation name and positioner transition/cancellation, not bubbled descendants', async () => {
        await act(async () => root.render(renderPanel(true, 'first', true)));
        const modal = host.querySelector<HTMLElement>('[data-cratis-part="root"]')!;
        const positioner = host.querySelector<HTMLElement>('[data-cratis-part="positioner"]')!;
        expectAnchorPosition();
        anchorLeft = 190;
        await act(async () => {
            const event = new Event('animationend', { bubbles: true });
            Object.defineProperty(event, 'animationName', { value: 'custom-side-entry' });
            modal.dispatchEvent(event);
        });
        expect(frames.length).to.equal(1);
        await flushFrame();
        expectAnchorPosition();

        anchorLeft = 210;
        await act(async () => {
            modal.querySelector('button')!.dispatchEvent(new Event('transitionend', { bubbles: true }));
        });
        expect(frames.length).to.equal(0);
        await act(async () => {
            positioner.dispatchEvent(new Event('transitionend', { bubbles: true }));
            positioner.dispatchEvent(new Event('animationcancel', { bubbles: true }));
        });
        expect(frames.length).to.equal(1);
        await flushFrame();
        expectAnchorPosition();
    });
});
