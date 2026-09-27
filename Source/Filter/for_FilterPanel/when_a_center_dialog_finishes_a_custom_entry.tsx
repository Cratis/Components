// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { Dialog } from '../../Dialogs/Dialog';
import { type DialogInTheDom, render, unmount } from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { FilterPanel } from '../FilterPanel';

const noOp = () => undefined;

/** jsdom has no layout or CSS animations: model the entry/final probe and anchor rectangles. */
describe('when a centered Dialog has a custom transform entry', () => {
    let mounted: DialogInTheDom;
    afterEach(async () => {
        if (mounted) await unmount(mounted);
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('remeasures an initially open panel when its root or positioner finishes moving without losing focus', async () => {
        const anchorRef = createRef<HTMLButtonElement>();
        let entering = true;
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
        vi.stubGlobal('cancelAnimationFrame', () => undefined);
        const originalRect = HTMLElement.prototype.getBoundingClientRect;
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            if (this === anchorRef.current) {
                const left = entering ? 200 : 260;
                return { left, right: left + 40, top: 100, bottom: 125, width: 40, height: 25 } as DOMRect;
            }
            if (this.style.visibility === 'hidden' && this.style.position === 'fixed') {
                const left = entering ? 80 : 0;
                const size = entering ? 0.8 : 1;
                return { left, right: left + size, top: 0, bottom: 0, width: size, height: size } as DOMRect;
            }
            return originalRect.call(this);
        });
        mounted = await render(<Dialog title='Center filters' onCancel={noOp}
            pt={{ root: { className: 'custom-center-entry' }, positioner: { className: 'custom-center-positioner' } }}>
            <style>{'@keyframes custom-center-entry { from { transform: translateX(80px) scale(.8); } to { transform: none; } } .custom-center-entry[data-entering] { animation: custom-center-entry 200ms ease-out; }'}</style>
            <button ref={anchorRef}>Filter trigger</button>
            <FilterPanel isOpen filters={[]} filterValues={{}} rangeValues={{}}
                anchorRef={anchorRef} onClose={noOp} onFilterToggle={noOp}
                onFilterClear={noOp} onRangeChange={noOp} onExpandedFilterChange={noOp} />
        </Dialog>);
        const panel = document.querySelector<HTMLElement>('.pv-filter-dropdown')!;
        const modal = anchorRef.current!.closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]')!;
        const positioner = modal.parentElement!;
        expect(modal.dataset.placement).to.equal('center');
        expect(panel.parentElement).to.equal(modal);
        expect(panel.style.left).to.equal('150px');
        panel.focus();
        const focused = document.activeElement;
        // Dialog mounting may schedule its own motion frame; only count frames from the motion-end events.
        frames.splice(0);
        entering = false;
        // Without a motion-end listener the stale 150px survives after the transform disappears.
        await act(async () => modal.dispatchEvent(new Event('animationend', { bubbles: true })));
        expect(frames.length).to.equal(1);
        await act(async () => frames.splice(0).forEach((callback) => callback(0)));
        expect(panel.style.left).to.equal('260px');
        expect(document.activeElement).to.equal(focused);

        // Bubbled events from controls should not schedule redundant measurements.
        await act(async () => panel.dispatchEvent(new Event('transitionend', { bubbles: true })));
        expect(frames.length).to.equal(0);
        await act(async () => {
            positioner.dispatchEvent(new Event('animationcancel', { bubbles: true }));
            positioner.dispatchEvent(new Event('transitionend', { bubbles: true }));
        });
        expect(frames.length).to.equal(1);
        await act(async () => frames.splice(0).forEach((callback) => callback(0)));
        expect(panel.style.left).to.equal('260px');
        expect(document.activeElement).to.equal(focused);
    });
});
