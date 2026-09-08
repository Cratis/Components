// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../ChatAuthorKind';
import { ChatComposer } from '../ChatComposer';
import type { MentionCandidate } from '../Mentions';
import {
    click,
    render,
    typeInto,
    unmount,
    type ComposerInTheDom,
} from './given/a_composer_in_the_dom';

describe('when candidates come from a provider', () => {
    let composer: ComposerInTheDom;
    let queriesSeen: string[];
    let sentText: string | undefined;
    let sentMentions: MentionCandidate[] | undefined;

    const scout: MentionCandidate = {
        id: 'agent-1',
        name: 'Scout',
        hasAvatar: false,
        kind: ChatAuthorKind.Agent,
    };

    beforeEach(async () => {
        queriesSeen = [];
        sentText = undefined;
        sentMentions = undefined;

        composer = await render(
            createElement(ChatComposer, {
                resolveMentionCandidates: (query: string) => {
                    queriesSeen.push(query);
                    return Promise.resolve([scout]);
                },
                onSend: (text: string, mentions: MentionCandidate[]) => {
                    sentText = text;
                    sentMentions = mentions;
                },
            }),
        );

        await typeInto(
            document.querySelector<HTMLTextAreaElement>('.chat-composer__input')!,
            'ask @sc',
        );
    });

    afterEach(async () => {
        await unmount(composer);
    });

    it('should ask the provider with what was typed after the @', () =>
        queriesSeen.should.contain('sc'));

    it('should suggest what the provider answered', () => {
        document.querySelectorAll('.mention-suggestions__item').should.have.lengthOf(1);
        document
            .querySelector('.mention-suggestions__name')!
            .textContent!.should.equal('Scout');
    });

    describe('and the suggestion is picked and sent', () => {
        beforeEach(async () => {
            await click(
                document.querySelector<HTMLButtonElement>('.mention-suggestions__item')!,
            );
            await click(
                document.querySelector<HTMLButtonElement>('.chat-composer__send')!,
            );
        });

        it('should write the full name into the draft before sending', () =>
            sentText!.should.equal('ask @Scout'));
        it('should report the mention on send', () => {
            sentMentions!.should.have.lengthOf(1);
            sentMentions![0].id.should.equal('agent-1');
        });
        it('should close the suggestions once the mention is complete', () =>
            (document.querySelector('.mention-suggestions') === null).should.be.true);
    });
});
