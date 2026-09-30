// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type { MarkdownCompletion } from '../MarkdownCompletion';
import type { MarkdownSuggestion } from '../MarkdownSuggestion';
import { press, renderEditor, settle, typeInto, unmount, click, type EditorInTheDom } from './given/an_editor_in_the_dom';

const suggestions: MarkdownSuggestion[] = [
    { id: '12', insertText: 'sample/repository#12', label: 'Model discovery', detail: 'sample/repository#12', annotation: 'Issue' },
    { id: '14', insertText: 'sample/repository#14', label: 'Model import', detail: 'sample/repository#14', annotation: 'Pull request' },
];

const list = () => document.querySelector<HTMLElement>('[data-cratis-part="suggestions"]');
const options = () => Array.from(document.querySelectorAll<HTMLElement>('[data-cratis-part="suggestion"]'));

describe('when completing a trigger', () => {
    let editor: EditorInTheDom;
    let queries: string[];

    beforeEach(async () => {
        queries = [];
        const issues: MarkdownCompletion = {
            trigger: '#',
            allowSpaces: true,
            debounce: 0,
            label: 'Issues',
            suggest: query => {
                queries.push(query);
                return Promise.resolve(suggestions);
            },
        };
        editor = await renderEditor('', { completions: [issues] });
        await typeInto(editor.textarea(), 'See #model');
        await settle();
    });

    afterEach(async () => {
        await unmount(editor);
    });

    it('should ask the completion with what was typed after the trigger', () => queries.should.contain('model'));
    it('should open the list with the completion\'s name', () => list()!.getAttribute('aria-label')!.should.equal('Issues'));
    it('should show every suggestion', () => options().should.have.lengthOf(2));
    it('should render the default detail, label and annotation', () =>
        options()[1].textContent!.should.equal('sample/repository#14Model importPull request'));
    it('should highlight the first suggestion', () => options()[0].getAttribute('aria-selected')!.should.equal('true'));
    it('should point the writing area at the highlighted suggestion', () =>
        editor.textarea().getAttribute('aria-activedescendant')!.should.equal(options()[0].id));
    it('should keep the list out of reach of a surrounding modal', () =>
        list()!.getAttribute('data-react-aria-top-layer')!.should.equal('true'));

    describe('and the next suggestion is picked with the keyboard', () => {
        beforeEach(async () => {
            await press(editor.textarea(), 'ArrowDown');
            await press(editor.textarea(), 'Enter');
        });

        it('should replace the trigger and query with the suggestion', () =>
            editor.changes[editor.changes.length - 1].should.equal('See sample/repository#14'));
        it('should close the list', () => (list() === null).should.be.true);
    });

    describe('and a suggestion is clicked', () => {
        beforeEach(async () => {
            await click(options()[0]);
        });

        it('should replace the trigger and query with the suggestion', () =>
            editor.changes[editor.changes.length - 1].should.equal('See sample/repository#12'));
    });

    describe('and the list is dismissed', () => {
        beforeEach(async () => {
            await press(editor.textarea(), 'Escape');
            await typeInto(editor.textarea(), 'See #model d');
            await settle();
        });

        it('should stay closed while the same trigger is typed on', () => (list() === null).should.be.true);
    });
});
