// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Guid } from '@cratis/fundamentals';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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

export const ComposerMentionKeyboard: Story = {
    render: () => <ChatComposer mentionCandidates={candidates} onSend={fn()} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('textbox');
        await userEvent.type(input, '@');

        // The highlight is exposed to assistive technology while focus stays in the textarea.
        const listbox = canvas.getByRole('listbox');
        await expect(input).toHaveAttribute('aria-controls', listbox.id);
        const options = canvas.getAllByRole('option');
        await expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
        await userEvent.keyboard('{ArrowDown}');
        await expect(input).toHaveAttribute('aria-activedescendant', options[1].id);

        // Escape closes the list and keeps the text; editing the query reopens it.
        await userEvent.keyboard('{Escape}');
        await expect(canvas.queryByRole('listbox')).toBeNull();
        await expect(input).toHaveValue('@');
        await userEvent.keyboard('S');
        await expect(canvas.getByRole('listbox')).toBeVisible();

        // Tab picks the highlighted option.
        await userEvent.keyboard('{Tab}');
        await expect(input).toHaveValue('@Sample User ');
    },
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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const choices = canvas.getByRole('group', { name: 'Pick an emoji' });
        const buttons = within(choices).getAllByRole('button');
        await waitFor(async () => expect(canvas.getAllByRole('tab')[0]).toHaveFocus());
        await userEvent.click(buttons[0]);
        await userEvent.keyboard('{ArrowDown}');
        await expect(buttons[8]).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        await expect(buttons[0]).toHaveFocus();
        await userEvent.tab({ shift: true });
        const tabs = canvas.getAllByRole('tab');
        await expect(tabs[0]).toHaveFocus();
        await userEvent.keyboard('{End}');
        await expect(tabs.at(-1)).toHaveFocus();
        await expect(canvas.getAllByRole('tabpanel')).toHaveLength(1);
    },
};

const KeyboardPickerExample = () => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const [picked, setPicked] = useState('');
    return <>
        <button ref={anchorRef} onClick={() => setOpen(!open)}>React</button>
        <output aria-label='Picked emoji'>{picked}</output>
        {open && <ReactionPicker anchorRef={anchorRef} onDismiss={() => setOpen(false)} onPick={(emoji) => {
            setPicked(emoji);
            setOpen(false);
        }} />}
        <button>Outside</button>
    </>;
};

export const KeyboardReactionPicker: Story = {
    render: () => <KeyboardPickerExample />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const opener = canvas.getByRole('button', { name: 'React' });
        await userEvent.click(opener);
        await userEvent.keyboard('{End}');
        const quick = canvas.getByRole('group', { name: 'Pick an emoji' });
        await expect(quick).toContainElement(document.activeElement as HTMLElement);
        await expect(quick.querySelectorAll('[tabindex="0"]').length).toBe(1);
        await userEvent.tab();
        await userEvent.keyboard('{Enter}');
        const full = canvas.getByRole('group', { name: 'All emojis' });
        await waitFor(async () => expect(within(full).getAllByRole('tab')[0]).toHaveFocus());
        await userEvent.tab({ shift: true });
        await expect(canvas.getByRole('button', { name: 'All emojis' })).toHaveFocus();
        await userEvent.tab({ shift: true });
        await expect(quick).toContainElement(document.activeElement as HTMLElement);
        await userEvent.tab();
        await userEvent.tab();
        await userEvent.keyboard('{End}');
        const tabs = within(full).getAllByRole('tab');
        await expect(tabs.at(-1)).toHaveFocus();
        await expect(tabs.at(-1)).toHaveAttribute('aria-selected', 'true');
        await userEvent.keyboard('{ArrowRight}');
        await expect(tabs[0]).toHaveFocus();
        await userEvent.tab();
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'Outside' })).toHaveFocus();
        await userEvent.tab({ shift: true });
        await userEvent.keyboard(' ');
        await expect(canvas.getByLabelText('Picked emoji')).not.toBeEmptyDOMElement();
        await waitFor(async () => expect(opener).toHaveFocus());
        await userEvent.click(opener);
        await userEvent.keyboard('{Escape}');
        await expect(canvas.queryByRole('group')).not.toBeInTheDocument();
        await waitFor(async () => expect(opener).toHaveFocus());
    },
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
