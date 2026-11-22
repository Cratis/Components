// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type { MarkdownEditorProps } from '../MarkdownEditor';
import { MarkdownEditorMode } from '../MarkdownEditorMode';
import { renderEditor, select, unmount, type EditorInTheDom } from './given/an_editor_in_the_dom';

describe('when rendering the frame', () => {
    let editor: EditorInTheDom;
    const root = () => editor.container.querySelector<HTMLElement>('[data-cratis-part="root"]')!;
    const part = (name: string) => editor.container.querySelector<HTMLElement>(`[data-cratis-part="${name}"]`);
    const render = async (props: Omit<MarkdownEditorProps, 'value' | 'onChange'> = {}, value = 'Example text') => {
        editor = await renderEditor(value, props);
    };

    afterEach(async () => {
        await unmount(editor);
    });

    describe('with the defaults', () => {
        beforeEach(() => render());

        it('should fall back to the default height', () => root().style.minHeight.should.equal('320px'));
        it('should only carry the base class', () => root().className.should.equal('cratis-markdown-editor'));
        it('should identify the component', () => root().getAttribute('data-cratis-component')!.should.equal('MarkdownEditor'));
        it('should write no state attributes', () =>
            ['data-disabled', 'data-invalid', 'data-readonly', 'data-busy']
                .filter(attribute => root().hasAttribute(attribute))
                .should.be.empty);
        it('should name the writing area with the editor label', () =>
            editor.textarea().getAttribute('aria-label')!.should.equal('Markdown'));
        it('should show the toolbar', () => (part('toolbar') !== null).should.be.true);
        it('should not offer a toggle', () => (part('toggle') === null).should.be.true);
        it('should not announce anything', () => (part('status') === null).should.be.true);
    });

    describe('with a height in pixels', () => {
        beforeEach(() => render({ height: 200 }));

        it('should use the height in pixels', () => root().style.minHeight.should.equal('200px'));
    });

    describe('with a css length for the height', () => {
        beforeEach(() => render({ height: '12rem' }));

        it('should use the length as given', () => root().style.minHeight.should.equal('12rem'));
    });

    describe('with every state set and host classes', () => {
        beforeEach(() =>
            render({
                disabled: true,
                readOnly: true,
                invalid: true,
                className: 'example-host',
                renderPreview: markdown => markdown,
                pt: { root: { className: 'example-part', style: { color: 'red' } } },
            }),
        );

        it('should merge the classes in order', () =>
            root().className.should.equal('cratis-markdown-editor cratis-markdown-editor--toggleable example-host example-part'));
        it('should merge the part style', () => root().style.color.should.equal('red'));
        it('should mark every state', () =>
            ['data-disabled', 'data-invalid', 'data-readonly']
                .every(attribute => root().getAttribute(attribute) === 'true')
                .should.be.true);
        it('should mark the writing area invalid', () => editor.textarea().getAttribute('aria-invalid')!.should.equal('true'));
    });

    describe('with an external label', () => {
        beforeEach(() => render({ 'aria-labelledby': 'example-label', 'aria-describedby': 'example-hint', id: 'example-editor' }));

        it('should not name the writing area itself', () => editor.textarea().hasAttribute('aria-label').should.be.false);
        it('should reference the label', () => editor.textarea().getAttribute('aria-labelledby')!.should.equal('example-label'));
        it('should reference the description', () =>
            editor.textarea().getAttribute('aria-describedby')!.should.equal('example-hint'));
        it('should use the given id', () => editor.textarea().id.should.equal('example-editor'));
    });

    describe('with an external label and an own name', () => {
        beforeEach(() => render({ 'aria-labelledby': 'example-label', 'aria-label': 'Example name' }));

        it('should keep the own name', () => editor.textarea().getAttribute('aria-label')!.should.equal('Example name'));
    });

    describe('with only empty format groups', () => {
        beforeEach(() => render({ formats: [[], []] }));

        it('should render no toolbar', () => (part('toolbar') === null).should.be.true);
    });

    describe('opening in preview without a preview renderer', () => {
        beforeEach(() => render({ initialMode: MarkdownEditorMode.Preview }));

        it('should open in write mode', () => (part('textarea') !== null).should.be.true);
        it('should not show a preview', () => (part('preview') === null).should.be.true);
    });

    describe('opening in preview with a preview renderer', () => {
        beforeEach(() => render({ initialMode: MarkdownEditorMode.Preview, renderPreview: markdown => `rendered ${markdown}` }));

        it('should show the preview', () => part('preview')!.textContent!.should.equal('rendered Example text'));
        it('should hide the toolbar', () => (part('toolbar') === null).should.be.true);
        it('should hide the writing area', () => (part('textarea') === null).should.be.true);
    });

    describe('with a file pasted while read only', () => {
        let uploads: string[];

        beforeEach(async () => {
            uploads = [];
            await render({
                readOnly: true,
                uploadFile: async file => {
                    uploads.push(file.name);
                    return '';
                },
            });
            await select(editor.textarea(), 0, 0);
            const file = new File(['pixels'], 'sample.png', { type: 'image/png' });
            const event = new Event('paste', { bubbles: true, cancelable: true });
            Object.defineProperty(event, 'clipboardData', {
                value: { items: [{ kind: 'file', getAsFile: () => file }], files: [file], types: ['Files'] },
            });
            await act(async () => {
                editor.textarea().dispatchEvent(event);
            });
        });

        it('should not upload', () => uploads.should.be.empty);
        it('should not change the markdown', () => editor.changes.should.be.empty);
    });
});
