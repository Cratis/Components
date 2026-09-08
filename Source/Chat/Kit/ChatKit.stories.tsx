// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Guid } from '@cratis/fundamentals';
import { fn } from 'storybook/test';
import { AnchoredOverlay } from './AnchoredOverlay';
import { PersonAvatarCircle } from './Avatar/PersonAvatarCircle';
import { ChatAuthorKind } from './ChatAuthorKind';
import { ChatComposer } from './ChatComposer';
import type { ChatMessage } from './ChatMessage';
import { ChatMessageBubble } from './ChatMessageBubble';
import type { ChatMessageReaction } from './ChatMessageReaction';
import { EmojiPicker } from './Emoji/EmojiPicker';
import { FailedReply } from './FailedReply';
import { MentionSuggestions } from './Mentions/MentionSuggestions';
import type { MentionCandidate } from './Mentions/MentionCandidate';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker } from './ReactionPicker';
import { TypingIndicator } from './TypingIndicator';

const meta = {
    title: 'Chat/Kit/ChatKit',
    parameters: { layout: 'centered' },
    decorators: [
        (Story) => (
            <div
                style={{
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    background: 'var(--cratis-surface-overlay)',
                    color: 'var(--cratis-text-color)',
                    border: '1px solid var(--cratis-surface-border)',
                }}
            >
                <Story />
            </div>
        ),
    ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const viewerId = Guid.create();
const authorId = Guid.create();
const messageId = Guid.create();
const reactions: ChatMessageReaction[] = [
    {
        emoji: '👍',
        users: [
            { id: viewerId, name: 'You', reactionId: Guid.create() },
            { id: Guid.create(), name: 'Example Participant', reactionId: Guid.create() },
        ],
    },
    {
        emoji: '🎉',
        users: [
            { id: Guid.create(), name: 'Demo Participant', reactionId: Guid.create() },
        ],
    },
];
const message: ChatMessage = {
    id: messageId,
    authorId,
    authorName: 'Sample User',
    authorInitials: 'SU',
    hasAvatar: false,
    authorKind: ChatAuthorKind.User,
    text: 'This is a sample message.',
    timestamp: new Date(),
    reactions,
};
const candidates: MentionCandidate[] = [
    {
        id: authorId.toString(),
        name: 'Sample User',
        hasAvatar: false,
        kind: ChatAuthorKind.User,
    },
    {
        id: Guid.create().toString(),
        name: 'Demo Assistant',
        hasAvatar: false,
        kind: ChatAuthorKind.Agent,
    },
];

const AnchoredOverlayDemo = () => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
        <div style={{ minWidth: '20rem', minHeight: '8rem', padding: '2rem' }}>
            <button ref={anchorRef} type='button'>
                Anchor
            </button>
            <AnchoredOverlay anchorRef={anchorRef} open side='right'>
                <div
                    role='status'
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'var(--cratis-surface-overlay)',
                        color: 'var(--cratis-text-color)',
                        border: '1px solid var(--cratis-surface-border)',
                    }}
                >
                    Portaled beyond the board boundary
                </div>
            </AnchoredOverlay>
        </div>
    );
};

export const Anchored: Story = {
    render: () => <AnchoredOverlayDemo />,
};

export const Avatar: Story = {
    render: () => (
        <PersonAvatarCircle
            userId={authorId}
            name='Sample User'
            hasAvatar={false}
            size={56}
        />
    ),
};

export const Composer: Story = {
    render: () => <ChatComposer mentionCandidates={candidates} onSend={fn()} />,
};

export const MessageBubble: Story = {
    render: () => (
        <div style={{ width: '24rem' }}>
            <ChatMessageBubble
                message={message}
                showAuthor
                showTimestamp
                formattedTimestamp='just now'
                currentUserId={viewerId}
                onReact={fn()}
                onQuickReply={fn()}
            />
        </div>
    ),
};

export const FailedTurn: Story = {
    render: () => (
        <FailedReply
            message={{
                ...message,
                text: '',
                failureDetail: 'The review service timed out.',
            }}
            buildReportUrl={({ commentId }) =>
                `https://example.invalid/report/${commentId}`
            }
        />
    ),
};

export const Reactions: Story = {
    render: () => <MessageReactions reactions={reactions} />,
};

export const QuickReactionPicker: Story = {
    render: () => (
        <ReactionPicker
            ownEmoji='👍'
            reactions={reactions}
            onPick={fn()}
            onDismiss={fn()}
        />
    ),
};

export const AllEmojis: Story = {
    render: () => <EmojiPicker ownEmoji='👍' onPick={fn()} />,
};

export const Mentions: Story = {
    render: () => (
        <MentionSuggestions
            candidates={candidates}
            highlightedIndex={0}
            onSelect={fn()}
            onHighlight={fn()}
        />
    ),
};

export const Typing: Story = {
    render: () => (
        <TypingIndicator
            authors={[
                {
                    id: authorId.toString(),
                    name: 'Sample User',
                    hasAvatar: false,
                    kind: ChatAuthorKind.User,
                },
            ]}
            label='Sample User is typing…'
        />
    ),
};
