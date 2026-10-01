// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { renderEditor, select, settle, unmount, type EditorInTheDom } from './given/an_editor_in_the_dom';

const paste = async (textarea: HTMLTextAreaElement, file: File) => {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
        value: { items: [{ kind: 'file', getAsFile: () => file }], files: [file], types: ['Files'] },
    });
    await act(async () => {
        textarea.dispatchEvent(event);
    });
};

describe('when uploading a pasted file', () => {
    let editor: EditorInTheDom;
    let resolveUpload: (markup: string) => void;
    let rejectUpload: (reason: unknown) => void;
    let failures: string[];
    const file = new File(['pixels'], 'sample.png', { type: 'image/png' });

    beforeEach(async () => {
        failures = [];
        editor = await renderEditor('Look: ', {
            uploadFile: () =>
                new Promise<string>((resolve, reject) => {
                    resolveUpload = resolve;
                    rejectUpload = reject;
                }),
            onUploadFailed: failed => failures.push(failed.name),
        });
        await select(editor.textarea(), 6, 6);
        await paste(editor.textarea(), file);
    });

    afterEach(async () => {
        await unmount(editor);
    });

    it('should put a placeholder in at the caret straight away', () =>
        editor.textarea().value.should.equal('Look: ![Uploading sample.png…]()\n'));
    it('should announce the upload', () =>
        editor.container.querySelector('[data-cratis-part="status"]')!.textContent!.should.equal('Uploading sample.png…'));
    it('should mark the editor busy', () =>
        editor.container.querySelector('[data-cratis-part="root"]')!.hasAttribute('data-busy').should.be.true);

    describe('and the upload succeeds', () => {
        beforeEach(async () => {
            resolveUpload('![sample](https://example.invalid/sample.png)');
            await settle();
        });

        it('should replace the placeholder with the returned markdown', () =>
            editor.textarea().value.should.equal('Look: ![sample](https://example.invalid/sample.png)\n'));
        it('should stop announcing the upload', () =>
            (editor.container.querySelector('[data-cratis-part="status"]') === null).should.be.true);
    });

    describe('and the upload fails', () => {
        beforeEach(async () => {
            rejectUpload(new Error('offline'));
            await settle();
        });

        it('should take the placeholder out again', () => editor.textarea().value.should.equal('Look: '));
        it('should report the failed file', () => failures.should.deep.equal(['sample.png']));
    });
});
