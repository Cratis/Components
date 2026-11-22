// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type { MarkdownEditorProps } from '../MarkdownEditor';
import { renderEditor, select, unmount, type EditorInTheDom } from './given/an_editor_in_the_dom';

describe('when using a format shortcut', () => {
    let editor: EditorInTheDom;
    let notPrevented: boolean;

    const pressShortcut = async (
        key: string,
        modifiers: KeyboardEventInit,
        props: Omit<MarkdownEditorProps, 'value' | 'onChange'> = {},
    ) => {
        editor = await renderEditor('lean', props);
        await select(editor.textarea(), 0, 4);
        await act(async () => {
            notPrevented = editor.textarea().dispatchEvent(
                new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers }),
            );
        });
    };

    afterEach(async () => {
        await unmount(editor);
    });

    describe('with the meta key', () => {
        beforeEach(() => pressShortcut('b', { metaKey: true }));

        it('should format the selection', () => editor.changes.should.deep.equal(['**lean**']));
        it('should prevent the default action', () => notPrevented.should.be.false);
    });

    describe('with an uppercase letter', () => {
        beforeEach(() => pressShortcut('I', { ctrlKey: true }));

        it('should format the selection', () => editor.changes.should.deep.equal(['_lean_']));
    });

    describe('without control or meta', () => {
        beforeEach(() => pressShortcut('b', {}));

        it('should not format', () => editor.changes.should.be.empty);
        it('should leave the default action', () => notPrevented.should.be.true);
    });

    describe('with shift held', () => {
        beforeEach(() => pressShortcut('b', { ctrlKey: true, shiftKey: true }));

        it('should not format', () => editor.changes.should.be.empty);
        it('should leave the default action', () => notPrevented.should.be.true);
    });

    describe('with alt held', () => {
        beforeEach(() => pressShortcut('b', { metaKey: true, altKey: true }));

        it('should not format', () => editor.changes.should.be.empty);
        it('should leave the default action', () => notPrevented.should.be.true);
    });

    describe('with a letter that has no format', () => {
        beforeEach(() => pressShortcut('q', { ctrlKey: true }));

        it('should not format', () => editor.changes.should.be.empty);
        it('should leave the default action', () => notPrevented.should.be.true);
    });

    describe('while read only', () => {
        beforeEach(() => pressShortcut('b', { ctrlKey: true }, { readOnly: true }));

        it('should not format', () => editor.changes.should.be.empty);
        it('should leave the default action', () => notPrevented.should.be.true);
    });

    describe('while disabled', () => {
        beforeEach(() => pressShortcut('b', { ctrlKey: true }, { disabled: true }));

        it('should not format', () => editor.changes.should.be.empty);
        it('should leave the default action', () => notPrevented.should.be.true);
    });

    describe('after a host handler prevented it', () => {
        beforeEach(() =>
            pressShortcut('b', { ctrlKey: true }, { pt: { textarea: { onKeyDown: event => event.preventDefault() } } }),
        );

        it('should not format', () => editor.changes.should.be.empty);
    });
});
