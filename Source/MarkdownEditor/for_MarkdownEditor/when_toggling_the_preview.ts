// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { click, renderEditor, unmount, type EditorInTheDom } from './given/an_editor_in_the_dom';

const toggle = (editor: EditorInTheDom) =>
    editor.container.querySelector<HTMLButtonElement>('[data-cratis-part="toggle"]');

describe('when toggling the preview', () => {
    let editor: EditorInTheDom;

    afterEach(async () => {
        await unmount(editor);
    });

    describe('with a preview renderer', () => {
        beforeEach(async () => {
            editor = await renderEditor('# Sample', {
                renderPreview: markdown => createElement('article', { className: 'rendered' }, `rendered: ${markdown}`),
            });
            await click(toggle(editor)!);
        });

        it('should show the rendered markdown', () =>
            editor.container.querySelector('.rendered')!.textContent!.should.equal('rendered: # Sample'));
        it('should hide the writing area', () =>
            (editor.container.querySelector('[data-cratis-part="textarea"]') === null).should.be.true);
        it('should announce the toggle as pressed', () => toggle(editor)!.getAttribute('aria-pressed')!.should.equal('true'));
        it('should name what pressing it does next', () =>
            toggle(editor)!.getAttribute('aria-label')!.should.equal('Show markdown'));

        describe('and it is toggled back', () => {
            beforeEach(async () => {
                await click(toggle(editor)!);
            });

            it('should show the markdown again', () => editor.textarea().value.should.equal('# Sample'));
        });
    });

    describe('with nothing to preview', () => {
        beforeEach(async () => {
            editor = await renderEditor('', { renderPreview: () => 'never', labels: { emptyPreview: 'Empty' } });
            await click(toggle(editor)!);
        });

        it('should show the empty label rather than rendering', () =>
            editor.container.querySelector('[data-cratis-part="preview"]')!.textContent!.should.equal('Empty'));
    });

    describe('without a preview renderer', () => {
        beforeEach(async () => {
            editor = await renderEditor('# Sample');
        });

        it('should offer no toggle', () => (toggle(editor) === null).should.be.true);
    });
});
