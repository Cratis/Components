// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect, vi } from 'vitest';
import { useReactionPickerFocus } from '../useReactionPickerFocus';
import { Overlay, render, unmount } from './given/an_overlay_in_the_dom';

const Picker = ({ dismiss }: { dismiss: () => void }) => {
    const { rootRef, onKeyDown } = useReactionPickerFocus(undefined, dismiss);
    return <div ref={rootRef} onKeyDown={onKeyDown} data-picker>Picker</div>;
};

describe('when an overlay belongs to another document', () => {
    let frame: HTMLIFrameElement;
    beforeEach(() => {
        frame = document.createElement('iframe');
        document.body.append(frame);
    });
    afterEach(() => { frame.remove(); vi.restoreAllMocks(); });

    it('should use its window viewport and clean up its positioning listeners', async () => {
        const ownerWindow = frame.contentWindow!;
        Object.defineProperty(ownerWindow, 'innerHeight', { value: 1200, configurable: true });
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            return this.tagName === 'BUTTON' ? new DOMRect(20, 700, 40, 20) : new DOMRect();
        });
        const add = vi.spyOn(ownerWindow, 'addEventListener');
        const remove = vi.spyOn(ownerWindow, 'removeEventListener');
        const mounted = await render(<Overlay environment={{ getContainer: () => frame.contentDocument!.body }} />);
        const overlay = frame.contentDocument!.querySelector<HTMLElement>('[data-picker]')?.parentElement;
        const resize = add.mock.calls.find(([name]) => name === 'resize');
        const scroll = add.mock.calls.find(([name]) => name === 'scroll');
        await unmount(mounted);
        expect(overlay?.style.top).toBe('728px');
        expect(resize).toBeDefined();
        expect(scroll).toBeDefined();
        expect(remove.mock.calls).toContainEqual(resize);
        expect(remove.mock.calls).toContainEqual(scroll);
    });

    it('should dismiss on outside pointers in its owner document and remove that listener', async () => {
        const ownerDocument = frame.contentDocument!;
        const dismiss = vi.fn();
        const add = vi.spyOn(ownerDocument, 'addEventListener');
        const remove = vi.spyOn(ownerDocument, 'removeEventListener');
        const mounted = await render(<Overlay environment={{ getContainer: () => ownerDocument.body }}><Picker dismiss={dismiss} /></Overlay>);
        const pointer = add.mock.calls.find(([name]) => name === 'pointerdown');
        await act(async () => {
            ownerDocument.querySelector('[data-picker]')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        });
        expect(dismiss).not.toHaveBeenCalled();
        await act(async () => { ownerDocument.body.dispatchEvent(new Event('pointerdown', { bubbles: true })); });
        expect(dismiss).toHaveBeenCalledOnce();
        await unmount(mounted);
        expect(pointer).toBeDefined();
        expect(remove.mock.calls).toContainEqual(pointer);
        ownerDocument.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(dismiss).toHaveBeenCalledOnce();
    });
});
