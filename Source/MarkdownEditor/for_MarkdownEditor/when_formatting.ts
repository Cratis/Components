// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { click, press, renderEditor, select, unmount, type EditorInTheDom } from './given/an_editor_in_the_dom';

describe('when formatting', () => {
    let editor: EditorInTheDom;

    afterEach(async () => {
        await unmount(editor);
    });

    describe('with a toolbar button', () => {
        beforeEach(async () => {
            editor = await renderEditor('make this loud');
            await select(editor.textarea(), 5, 9);
            await click(editor.container.querySelector<HTMLButtonElement>('[aria-label="Bold"]')!);
        });

        it('should format the selection', () => editor.changes[0].should.equal('make **this** loud'));
        it('should keep the formatted text selected', () => {
            editor.textarea().selectionStart.should.equal(7);
            editor.textarea().selectionEnd.should.equal(11);
        });
    });

    describe('with a keyboard shortcut', () => {
        beforeEach(async () => {
            editor = await renderEditor('lean');
            await select(editor.textarea(), 0, 4);
            await press(editor.textarea(), 'i', { ctrlKey: true });
        });

        it('should format the selection', () => editor.changes[0].should.equal('_lean_'));
    });

    describe('when read only', () => {
        beforeEach(async () => {
            editor = await renderEditor('fixed', { readOnly: true });
        });

        it('should disable every format', () =>
            Array.from(editor.container.querySelectorAll<HTMLButtonElement>('[data-cratis-part="format"]'))
                .every(button => button.disabled)
                .should.be.true);
    });

    describe('with the toolbar turned off', () => {
        beforeEach(async () => {
            editor = await renderEditor('plain', { formats: false });
        });

        it('should render no toolbar', () =>
            (editor.container.querySelector('[data-cratis-part="toolbar"]') === null).should.be.true);
    });
});
