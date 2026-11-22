// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { unmountPrimitive } from '../../../../Common/for_Primitives/given/a_primitive_dom';
import { mountNote, pointAt } from './given/a_note';

describe('when fitting note text', () => {
    let mounted: Awaited<ReturnType<typeof mountNote>>;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        vi.restoreAllMocks();
    });

    it('should fit the largest font within the padded height', async () => {
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
            return Number.parseFloat(this.style.fontSize) * 2;
        });
        mounted = await mountNote();
        const text = mounted.element.querySelector<HTMLElement>('.canvas-note__text')!;
        expect(Number.parseFloat(text.style.fontSize)).to.be.within(67, 68);
        expect(mounted.element.querySelector('button')).to.equal(null);
        expect(mounted.props.onExpandedChange).toHaveBeenCalledWith('sample-note', false);
    });

    it('should expand overflowing text temporarily and hide resize handles while expanded', async () => {
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(300);
        mounted = await mountNote();
        const button = mounted.element.querySelector<HTMLButtonElement>('.canvas-note__expand')!;
        expect(button.getAttribute('aria-label')).to.equal('See full text');
        expect(mounted.element.querySelector<HTMLElement>('.canvas-note__text')?.style.fontSize).to.equal('4px');
        await act(async () => button.click());
        expect(mounted.element.style.height).to.equal('324px');
        expect(mounted.element.classList.contains('canvas-note--expanded')).to.equal(true);
        expect(mounted.element.querySelectorAll('.canvas-note__handle').length).to.equal(0);
        expect(mounted.props.onExpandedChange).toHaveBeenLastCalledWith('sample-note', true);
        await pointAt(mounted.element, 'pointerout', { relatedTarget: document.body });
        expect(mounted.element.style.height).to.equal('160px');
        expect(mounted.element.querySelectorAll('.canvas-note__handle').length).to.equal(8);
        expect(mounted.props.onExpandedChange).toHaveBeenLastCalledWith('sample-note', false);
    });

    it('should size blank text from the note dimensions without showing overflow', async () => {
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(300);
        mounted = await mountNote({ note: { id: 'blank-note', x: 0, y: 0, width: 200, height: 160, text: '  ' } });
        expect(mounted.element.querySelector<HTMLElement>('.canvas-note__text')?.style.fontSize).to.equal('64px');
        expect(mounted.element.querySelector('button')).to.equal(null);
    });
});
