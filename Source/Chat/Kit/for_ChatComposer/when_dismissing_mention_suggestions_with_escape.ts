// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../ChatAuthorKind';
import { ChatComposer } from '../ChatComposer';
import type { MentionCandidate } from '../Mentions';
import {
    moveCaret,
    press,
    render,
    typeInto,
    unmount,
    type ComposerInTheDom,
} from './given/a_composer_in_the_dom';

describe('when dismissing mention suggestions with escape', () => {
    let composer: ComposerInTheDom;
    let textarea: HTMLTextAreaElement;
    let sent: string[];
    let escapeReachedDocument: boolean;

    const person = (id: string, name: string): MentionCandidate => ({
        id,
        name,
        hasAvatar: false,
        kind: ChatAuthorKind.User,
    });

    const listener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') escapeReachedDocument = true;
    };
    const suggestionsOpen = () => document.querySelector('.mention-suggestions') !== null;

    beforeEach(async () => {
        sent = [];
        escapeReachedDocument = false;
        document.addEventListener('keydown', listener);
        composer = await render(
            createElement(ChatComposer, {
                mentionCandidates: [person('1', 'Sam'), person('2', 'Sally')],
                onSend: (text: string) => sent.push(text),
            }),
        );
        textarea = document.querySelector<HTMLTextAreaElement>('.chat-composer__input')!;
        await typeInto(textarea, 'hello @Sa');
        await press(textarea, 'ArrowDown');
    });

    afterEach(async () => {
        document.removeEventListener('keydown', listener);
        await unmount(composer);
    });

    describe('at the end of the draft', () => {
        beforeEach(async () => {
            await press(textarea, 'Escape');
        });

        it('should close the suggestions after keydown and keyup', () => suggestionsOpen().should.be.false);
        it('should keep the draft', () => textarea.value.should.equal('hello @Sa'));
        it('should keep the caret where it was', () => textarea.selectionStart.should.equal(9));
        it('should not let the escape reach a surrounding dialog', () => escapeReachedDocument.should.be.false);

        describe('and enter is pressed', () => {
            beforeEach(async () => {
                await press(textarea, 'Enter');
            });

            it('should send the literal draft instead of choosing a candidate', () =>
                sent.should.deep.equal(['hello @Sa']));
        });

        describe('and the query is edited', () => {
            beforeEach(async () => {
                await typeInto(textarea, 'hello @Sal');
            });

            it('should reopen the suggestions', () => suggestionsOpen().should.be.true);
        });

        describe('and only the caret moves within the same query', () => {
            beforeEach(async () => {
                await moveCaret(textarea, 9);
            });

            it('should keep the suggestions closed', () => suggestionsOpen().should.be.false);
        });
    });

    describe('in the middle of the draft', () => {
        beforeEach(async () => {
            await typeInto(textarea, 'hello @Sa and more');
            await moveCaret(textarea, 9);
            await press(textarea, 'Escape');
        });

        it('should close the suggestions', () => suggestionsOpen().should.be.false);
        it('should keep the draft', () => textarea.value.should.equal('hello @Sa and more'));
        it('should keep the caret where it was', () => textarea.selectionStart.should.equal(9));
    });

    describe('when no suggestions are open', () => {
        let notCancelled: boolean;

        beforeEach(async () => {
            await typeInto(textarea, 'hello');
            notCancelled = await press(textarea, 'Escape');
        });

        it('should leave the escape to the surrounding dialog', () => escapeReachedDocument.should.be.true);
        it('should not cancel the escape', () => notCancelled.should.be.true);
    });
});
