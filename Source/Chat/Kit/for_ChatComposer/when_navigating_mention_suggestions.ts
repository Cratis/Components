// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../ChatAuthorKind';
import { ChatComposer } from '../ChatComposer';
import type { MentionCandidate } from '../Mentions';
import {
    click,
    press,
    render,
    typeInto,
    unmount,
    type ComposerInTheDom,
} from './given/a_composer_in_the_dom';

describe('when navigating mention suggestions', () => {
    let composers: ComposerInTheDom[];
    let textarea: HTMLTextAreaElement;
    let resolve: ((candidates: MentionCandidate[]) => void) | undefined;

    const person = (id: string, name: string): MentionCandidate => ({
        id,
        name,
        hasAvatar: false,
        kind: ChatAuthorKind.User,
    });
    const candidates = [person('1', 'Sam'), person('2', 'Sally'), person('3', 'Sasha')];

    const activeDescendant = () => textarea.getAttribute('aria-activedescendant');
    const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')];
    const highlightedOption = () => options().find(option => option.getAttribute('aria-selected') === 'true');

    beforeEach(async () => {
        composers = [];
        resolve = undefined;
        composers.push(
            await render(createElement(ChatComposer, { mentionCandidates: candidates, onSend: () => {} })),
        );
        textarea = document.querySelector<HTMLTextAreaElement>('.chat-composer__input')!;
        await typeInto(textarea, '@Sa');
    });

    afterEach(async () => {
        for (const composer of composers) await unmount(composer);
    });

    it('should describe the textarea as a list autocomplete without making it a combobox', () => {
        textarea.getAttribute('aria-autocomplete')!.should.equal('list');
        (textarea.getAttribute('role') === null).should.be.true;
        (textarea.getAttribute('aria-expanded') === null).should.be.true;
    });

    it('should point aria-controls at the list', () =>
        document.getElementById(textarea.getAttribute('aria-controls')!)!.getAttribute('role')!.should.equal('listbox'));

    it('should point the active descendant at the highlighted option', () => {
        activeDescendant()!.should.equal(highlightedOption()!.id);
        activeDescendant()!.should.equal(options()[0].id);
    });

    it('should give every option a distinct id', () =>
        new Set(options().map(option => option.id)).size.should.equal(3));

    it('should keep options out of the tab order', () =>
        options().every(option => option.tabIndex === -1).should.be.true);

    describe('and the arrow down is pressed', () => {
        beforeEach(async () => {
            await press(textarea, 'ArrowDown');
        });

        it('should move the active descendant to the next option', () => {
            activeDescendant()!.should.equal(options()[1].id);
            (highlightedOption() === options()[1]).should.be.true;
        });

        it('should keep focus where it was', () => textarea.selectionStart.should.equal(3));
    });

    describe('and the arrow up is pressed', () => {
        beforeEach(async () => {
            await press(textarea, 'ArrowUp');
        });

        it('should wrap the active descendant to the last option', () =>
            activeDescendant()!.should.equal(options()[2].id));
    });

    describe('and the highlighted option is picked with tab', () => {
        beforeEach(async () => {
            await press(textarea, 'ArrowDown');
            await press(textarea, 'Tab');
        });

        it('should write that candidate into the draft', () => textarea.value.should.equal('@Sally '));
        it('should drop every reference to the closed list', () => {
            (textarea.getAttribute('aria-activedescendant') === null).should.be.true;
            (textarea.getAttribute('aria-controls') === null).should.be.true;
            (textarea.getAttribute('aria-autocomplete') === null).should.be.true;
        });
    });

    describe('and an option is picked with the pointer', () => {
        beforeEach(async () => {
            await click(options()[2]);
        });

        it('should write that candidate into the draft', () => textarea.value.should.equal('@Sasha '));
    });

    describe('and the suggestions are dismissed', () => {
        beforeEach(async () => {
            await press(textarea, 'Escape');
        });

        it('should leave no dangling references', () => {
            (textarea.getAttribute('aria-activedescendant') === null).should.be.true;
            (textarea.getAttribute('aria-controls') === null).should.be.true;
        });
    });

    describe('and the narrowed query leaves fewer options', () => {
        beforeEach(async () => {
            await press(textarea, 'ArrowUp');
            await typeInto(textarea, '@Sas');
        });

        it('should resolve the active descendant to an option that exists', () => {
            const target = document.getElementById(activeDescendant()!);
            (target !== null).should.be.true;
            options().should.include(target);
        });
    });

    describe('and a second composer offers the same candidates', () => {
        let other: HTMLTextAreaElement;

        beforeEach(async () => {
            composers.push(
                await render(createElement(ChatComposer, { mentionCandidates: candidates, onSend: () => {} })),
            );
            other = document.querySelectorAll<HTMLTextAreaElement>('.chat-composer__input')[1];
            await typeInto(other, '@Sa');
        });

        it('should not share ids between the two lists', () => {
            const ids = options().map(option => option.id);
            new Set(ids).size.should.equal(6);
            other.getAttribute('aria-controls')!.should.not.equal(textarea.getAttribute('aria-controls')!);
        });

        it('should resolve each active descendant inside its own list', () => {
            document.getElementById(other.getAttribute('aria-activedescendant')!)!
                .closest('[role=listbox]')!.id.should.equal(other.getAttribute('aria-controls')!);
        });
    });

    describe('and candidates arrive asynchronously', () => {
        let asyncTextarea: HTMLTextAreaElement;

        beforeEach(async () => {
            composers.push(
                await render(
                    createElement(ChatComposer, {
                        resolveMentionCandidates: () =>
                            new Promise<MentionCandidate[]>(done => {
                                resolve = done;
                            }),
                        onSend: () => {},
                    }),
                ),
            );
            asyncTextarea = document.querySelectorAll<HTMLTextAreaElement>('.chat-composer__input')[1];
            await typeInto(asyncTextarea, '@Sa');
        });

        it('should not reference a list before any candidate has arrived', () =>
            (asyncTextarea.getAttribute('aria-activedescendant') === null).should.be.true);

        it('should reference the first option once candidates arrive', async () => {
            const { act } = await import('react');
            await act(async () => {
                resolve!([person('9', 'Sara')]);
            });
            const target = document.getElementById(asyncTextarea.getAttribute('aria-activedescendant')!);
            target!.textContent!.should.contain('Sara');
        });
    });
});
