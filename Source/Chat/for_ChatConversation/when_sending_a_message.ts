// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../../Canvas/shapes/ChatBubble/ChatAuthorKind';
import { ChatConversation } from '../ChatConversation';
import type { ChatMention } from '../ChatMention';
import { pressEnter, render, typeInto, unmount, type ConversationInTheDom } from './given/a_conversation_in_the_dom';

describe('when sending a message that mentions somebody', () => {
    let conversation: ConversationInTheDom;
    let sentBody: string | undefined;
    let sentMentions: ChatMention[] | undefined;

    beforeEach(async () => {
        sentBody = undefined;
        sentMentions = undefined;
        conversation = await render(createElement(ChatConversation, {
            messages: [],
            onSendMessage: (body, mentions) => {
                sentBody = body;
                sentMentions = mentions;
            },
            mentionCandidates: [
                { id: 'agent-1', name: 'Demo Agent', hasAvatar: false, kind: ChatAuthorKind.Agent },
            ],
        }));

        const textarea = document.querySelector<HTMLTextAreaElement>('.chat-composer__input')!;
        await typeInto(textarea, 'over to you @Demo Agent  ');
        await pressEnter(textarea);
    });

    afterEach(async () => {
        await unmount(conversation);
    });

    it('should report the trimmed body', () => sentBody!.should.equal('over to you @Demo Agent'));
    it('should report one mention', () => sentMentions!.should.have.lengthOf(1));
    it('should carry who was mentioned', () => {
        sentMentions![0].id.should.equal('agent-1');
        sentMentions![0].name.should.equal('Demo Agent');
        sentMentions![0].kind.should.equal(ChatAuthorKind.Agent);
    });
});
