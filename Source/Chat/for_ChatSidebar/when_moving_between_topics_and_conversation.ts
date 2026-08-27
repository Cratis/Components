// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../Kit/ChatAuthorKind';
import { ChatSidebar } from '../ChatSidebar';
import type { ChatIdentifier } from '../ChatIdentifier';
import type { ChatMessage } from '../ChatMessage';
import type { ChatTopic } from '../ChatTopic';
import {
    click,
    render,
    unmount,
    type ChatSidebarInTheDom,
} from './given/a_chat_sidebar_in_the_dom';

describe('when moving between the topics and a conversation', () => {
    let sidebar: ChatSidebarInTheDom;
    let selections: (ChatIdentifier | undefined)[];

    const planning: ChatTopic = {
        id: 'topic-1',
        name: 'Sprint planning',
        lastActivity: new Date('2026-08-27T10:00:00Z'),
    };
    const retro: ChatTopic = {
        id: 'topic-2',
        name: 'Retro notes',
        lastActivity: new Date('2026-08-26T10:00:00Z'),
    };
    const messages: ChatMessage[] = [
        {
            id: 'message-1',
            topicId: 'topic-1',
            authorId: 'person-1',
            body: 'planning talk',
            timestamp: new Date('2026-08-27T10:00:00Z'),
        },
        {
            id: 'message-2',
            topicId: 'topic-2',
            authorId: 'person-1',
            body: 'retro talk',
            timestamp: new Date('2026-08-26T10:00:00Z'),
        },
    ];

    beforeEach(async () => {
        selections = [];
        sidebar = await render(
            createElement(ChatSidebar, {
                open: true,
                onClose: () => {},
                topics: [planning, retro],
                messages,
                onSendMessage: () => {},
                onTopicSelected: (topicId: ChatIdentifier | undefined) => {
                    selections.push(topicId);
                },
                authorOf: () => ({ name: 'Sample User', kind: ChatAuthorKind.User }),
            }),
        );
    });

    afterEach(async () => {
        await unmount(sidebar);
    });

    it('should open on the topic list', () => {
        document
            .querySelector('.cratis-chat-sidebar__title')!
            .textContent!.should.equal('Topics');
        (document.querySelector('.cratis-chat-topics') !== null).should.be.true;
    });

    it('should expose open without selected or synthesized busy state', () => {
        const backdrop = document.querySelector('[data-cratis-part="backdrop"]')!;
        const root = document.querySelector('[data-cratis-part="root"]')!;

        backdrop.getAttribute('data-open')!.should.equal('true');
        root.getAttribute('data-open')!.should.equal('true');
        backdrop.hasAttribute('data-selected').should.be.false;
        root.hasAttribute('data-selected').should.be.false;
        backdrop.hasAttribute('data-busy').should.be.false;
        root.hasAttribute('data-busy').should.be.false;
        (document.querySelector('[data-open="false"]') === null).should.be.true;
    });

    describe('and a topic is picked', () => {
        beforeEach(async () => {
            await click(
                document.querySelectorAll<HTMLButtonElement>(
                    '.cratis-chat-topics__topic',
                )[0],
            );
        });

        it('should show that conversation', () => {
            document
                .querySelector('.cratis-chat-sidebar__title')!
                .textContent!.should.equal('Sprint planning');
            document
                .querySelectorAll('.cratis-chat-message__body')
                .should.have.lengthOf(1);
            document
                .querySelector('.cratis-chat-message__body')!
                .textContent!.should.equal('planning talk');
        });

        it('should tell the host what was opened', () => {
            selections.should.have.lengthOf(1);
            String(selections[0]!).should.equal('topic-1');
        });

        it('should expose the selected conversation on the sidebar frame', () => {
            document
                .querySelector('[data-cratis-part="backdrop"]')!
                .getAttribute('data-selected')!
                .should.equal('true');
            document
                .querySelector('[data-cratis-part="root"]')!
                .getAttribute('data-selected')!
                .should.equal('true');
            (document.querySelector('[data-selected="false"]') === null).should.be.true;
        });

        describe('and the person goes back', () => {
            beforeEach(async () => {
                await click(
                    document.querySelector<HTMLButtonElement>(
                        '.cratis-chat-sidebar__back',
                    )!,
                );
            });

            it('should show the topic list again', () => {
                document
                    .querySelector('.cratis-chat-sidebar__title')!
                    .textContent!.should.equal('Topics');
                (document.querySelector('.cratis-chat-topics') !== null).should.be.true;
            });

            it('should tell the host the selection is gone', () => {
                selections.should.have.lengthOf(2);
                (selections[1] === undefined).should.be.true;
            });

            it('should remove selected from the sidebar frame', () => {
                document
                    .querySelector('[data-cratis-part="backdrop"]')!
                    .hasAttribute('data-selected').should.be.false;
                document
                    .querySelector('[data-cratis-part="root"]')!
                    .hasAttribute('data-selected').should.be.false;
            });
        });
    });
});
