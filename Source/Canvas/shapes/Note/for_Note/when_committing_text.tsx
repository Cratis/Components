// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { setNativeValue, unmountPrimitive } from '../../../../Common/for_Primitives/given/a_primitive_dom';
import { NoteTextChanged } from '../NoteTextChanged';
import { mountNote, pointAt } from './given/a_note';

const { publish } = vi.hoisted(() => ({ publish: vi.fn() }));
vi.mock('../../../../Common/messaging/useOptionalMessenger', () => ({ useOptionalMessenger: () => publish }));

describe('when committing note text', () => {
    let mounted: Awaited<ReturnType<typeof mountNote>>;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        vi.clearAllMocks();
    });

    it('should commit and publish once on blur rather than per keystroke', async () => {
        mounted = await mountNote();
        await act(async () => mounted.element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));
        const textarea = mounted.element.querySelector('textarea')!;
        await setNativeValue(textarea, 'Updated sample note');
        expect(mounted.props.onTextChange).not.toHaveBeenCalled();
        expect(publish).not.toHaveBeenCalled();
        await act(async () => textarea.blur());
        expect(mounted.props.onTextChange).toHaveBeenCalledExactlyOnceWith('sample-note', 'Updated sample note');
        expect(publish).toHaveBeenCalledExactlyOnceWith(new NoteTextChanged('sample-note', 'Updated sample note'));
        expect(vi.mocked(mounted.props.onTextChange).mock.invocationCallOrder[0]).to.be.lessThan(publish.mock.invocationCallOrder[0]);
        expect(mounted.element.querySelector('textarea')).to.equal(null);
    });

    it('should cancel editing on Escape and ignore note dragging while editing', async () => {
        mounted = await mountNote();
        await act(async () => mounted.element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));
        const textarea = mounted.element.querySelector('textarea')!;
        await setNativeValue(textarea, 'Uncommitted sample');
        await pointAt(mounted.element, 'pointerdown');
        await act(async () => textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
        expect(mounted.props.onSelect).not.toHaveBeenCalled();
        expect(mounted.props.onTextChange).not.toHaveBeenCalled();
        expect(publish).not.toHaveBeenCalled();
        expect(mounted.element.querySelector('.canvas-note__text')?.textContent).to.equal('Sample note');
    });
});
