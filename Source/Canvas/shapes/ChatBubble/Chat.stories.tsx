// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Guid } from '@cratis/fundamentals';
import { Chat } from './Chat';
import { ChatAuthorKind } from './ChatAuthorKind';
import type { ChatMessage } from './ChatMessage';
import type { MentionCandidate } from './Mentions';

const meta: Meta<typeof Chat> = {
    title: 'Canvas/Chat',
    component: Chat,
    parameters: {
        layout: 'centered',
    },
};

export default meta;

type Story = StoryObj<typeof Chat>;

const currentUserId = Guid.create();
const sampleUserId = Guid.create();
const demoAssistantId = Guid.create();

const mentionCandidates: MentionCandidate[] = [
    {
        id: sampleUserId.toString(),
        name: 'Sample User',
        hasAvatar: false,
        kind: ChatAuthorKind.User,
    },
    {
        id: demoAssistantId.toString(),
        name: 'Demo Assistant',
        hasAvatar: false,
        kind: ChatAuthorKind.Agent,
    },
];

function seedMessages(): ChatMessage[] {
    return [
        {
            id: Guid.create(),
            authorId: sampleUserId,
            authorName: 'Sample User',
            authorInitials: 'SU',
            hasAvatar: false,
            authorKind: ChatAuthorKind.User,
            text: 'Can you review this sample layout?',
            timestamp: new Date(Date.now() - 6 * 60_000),
        },
        {
            id: Guid.create(),
            authorId: demoAssistantId,
            authorName: 'Demo Assistant',
            authorInitials: 'DA',
            hasAvatar: false,
            authorKind: ChatAuthorKind.Agent,
            text: 'The spacing remains clear at each demonstrated zoom level.',
            timestamp: new Date(Date.now() - 4 * 60_000),
            reactions: [
                {
                    emoji: '👍',
                    users: [
                        { id: currentUserId, name: 'You', reactionId: Guid.create() },
                    ],
                },
            ],
        },
        {
            id: Guid.create(),
            authorId: currentUserId,
            authorName: 'You',
            authorInitials: 'Y',
            hasAvatar: false,
            authorKind: ChatAuthorKind.User,
            text: 'Thanks, the sample is ready.',
            timestamp: new Date(Date.now() - 60_000),
        },
    ];
}

/**
 * A working conversation: reactions (click the smiley on a message, or pick the same emoji again to
 * take it back), quick reply (the reply arrow prefills the composer with `@name`), `@`-mention
 * suggestions in the composer, and a typing indicator toggled from outside the panel to
 * show the typing indicator without needing another participant in the room.
 */
export const BasicThread: Story = {
    render: () => {
        const BasicThreadDemo = () => {
            const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
            const [isTyping, setIsTyping] = useState(false);

            const send = (text: string) => {
                setMessages((current) => [
                    ...current,
                    {
                        id: Guid.create(),
                        authorId: currentUserId,
                        authorName: 'You',
                        authorInitials: 'Y',
                        hasAvatar: false,
                        authorKind: ChatAuthorKind.User,
                        text,
                        timestamp: new Date(),
                    },
                ]);
            };

            const react = (messageId: Guid, emoji: string) => {
                setMessages((current) =>
                    current.map((message) => {
                        if (!message.id.equals(messageId)) return message;

                        // A person has one reaction per message: drop any existing reaction from "you" first.
                        const withoutYou = (message.reactions ?? [])
                            .map((reaction) => ({
                                ...reaction,
                                users: reaction.users.filter(
                                    (user) => !user.id.equals(currentUserId),
                                ),
                            }))
                            .filter((reaction) => reaction.users.length > 0);

                        const alreadyGaveThisEmoji = message.reactions?.some(
                            (reaction) =>
                                reaction.emoji === emoji &&
                                reaction.users.some((user) =>
                                    user.id.equals(currentUserId),
                                ),
                        );

                        // Picking the same emoji again takes the reaction back.
                        if (alreadyGaveThisEmoji)
                            return { ...message, reactions: withoutYou };

                        const target = withoutYou.find(
                            (reaction) => reaction.emoji === emoji,
                        );
                        const yourReaction = {
                            id: currentUserId,
                            name: 'You',
                            reactionId: Guid.create(),
                        };
                        const reactions = target
                            ? withoutYou.map((reaction) =>
                                  reaction.emoji === emoji
                                      ? {
                                            ...reaction,
                                            users: [...reaction.users, yourReaction],
                                        }
                                      : reaction,
                              )
                            : [...withoutYou, { emoji, users: [yourReaction] }];

                        return { ...message, reactions };
                    }),
                );
            };

            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        width: 380,
                    }}
                >
                    <button
                        type='button'
                        onClick={() => setIsTyping((current) => !current)}
                    >
                        {isTyping
                            ? 'Stop demo assistant typing'
                            : 'Simulate demo assistant typing'}
                    </button>
                    <div
                        style={{
                            height: 480,
                            border: '1px solid var(--cratis-surface-border)',
                            borderRadius: 12,
                            overflow: 'hidden',
                        }}
                    >
                        <Chat
                            messages={messages}
                            onSend={send}
                            onClose={() => {
                                /* Chat is embedded inline in the story; there is no panel to close. */
                            }}
                            currentUserId={currentUserId}
                            onReact={react}
                            mentionCandidates={mentionCandidates}
                            typingAuthors={
                                isTyping
                                    ? [
                                          {
                                              id: demoAssistantId.toString(),
                                              name: 'Demo Assistant',
                                              hasAvatar: false,
                                              kind: ChatAuthorKind.Agent,
                                          },
                                      ]
                                    : []
                            }
                        />
                    </div>
                </div>
            );
        };

        return <BasicThreadDemo />;
    },
};

/**
 * A turn that ended in failure renders as a {@link FailedReply} line instead of a normal bubble — it
 * says plainly that the answer never came, with a "See error" link that opens the raw detail. There is
 * no built-in retry action in this kit; re-sending is left to whatever the host's own send flow does.
 */
export const WithFailedTurn: Story = {
    render: () => {
        const WithFailedTurnDemo = () => {
            const [messages] = useState<ChatMessage[]>(() => [
                ...seedMessages().slice(0, 1),
                {
                    id: Guid.create(),
                    authorId: demoAssistantId,
                    authorName: 'Demo Assistant',
                    authorInitials: 'DA',
                    hasAvatar: false,
                    authorKind: ChatAuthorKind.Agent,
                    text: '',
                    timestamp: new Date(),
                    failureDetail:
                        'The sample request timed out before a response was available.',
                },
            ]);

            return (
                <div
                    style={{
                        height: 420,
                        width: 380,
                        border: '1px solid var(--cratis-surface-border)',
                        borderRadius: 12,
                        overflow: 'hidden',
                    }}
                >
                    <Chat
                        messages={messages}
                        onSend={() => {
                            /* This story only shows the failed-turn line; sending is not wired up. */
                        }}
                        onClose={() => {
                            /* Chat is embedded inline in the story; there is no panel to close. */
                        }}
                        buildReportUrl={(details) =>
                            `https://example.invalid/report?title=${encodeURIComponent(details.title)}`
                        }
                    />
                </div>
            );
        };

        return <WithFailedTurnDemo />;
    },
};
