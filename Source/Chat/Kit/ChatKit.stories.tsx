// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dialog } from '../../Dialogs/Dialog';
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

const ScopedDialogPickers = () => {
    const target = useRef<HTMLDivElement>(null);
    const [stacked, setStacked] = useState(false);
    const [picked, setPicked] = useState('');
    return <CratisComponentsProvider overlayEnvironment={{ getContainer: () => target.current }}>
        <div ref={target} data-chat-overlay-target style={{
            width: '1000px', height: '720px', position: 'relative',
            transform: 'translate(24px, 16px) scale(0.9)', transformOrigin: 'top left',
            '--cratis-z-index-dialog': '10100',
        } as CSSProperties} />
        <Dialog title='First chat dialog' buttons={null}>
            <button onClick={() => setStacked(true)}>Open second chat dialog</button>
        </Dialog>
        {stacked && <Dialog title='Second chat dialog' buttons={null} width='540px'>
            <div data-chat-theme-scope className='cratis-theme-dark' style={{ '--cratis-surface-overlay': 'rgb(12, 23, 34)' } as CSSProperties}>
                <ChatMessageBubble message={{ ...message, reactions: [] }} currentUserId={viewerId} showAuthor={false}
                    showTimestamp={false} formattedTimestamp='' onReact={(_id, emoji) => setPicked(emoji)} />
                <ChatComposer onSend={() => undefined} />
                <output aria-label='Picked reaction'>{picked}</output>
            </div>
        </Dialog>}
    </CratisComponentsProvider>;
};

async function expectAnchoredPicker(target: HTMLElement, trigger: HTMLElement) {
    const picker = target.querySelector<HTMLElement>('.reaction-picker')!;
    const overlay = picker.parentElement!;
    await waitFor(() => {
        const anchorRect = trigger.getBoundingClientRect();
        const pickerRect = overlay.getBoundingClientRect();
        expect(Math.abs(anchorRect.top - pickerRect.bottom - 6)).toBeLessThan(2);
        expect(Math.min(Math.abs(anchorRect.left - pickerRect.left), Math.abs(anchorRect.right - pickerRect.right))).toBeLessThan(2);
    });
    await expect(overlay.parentElement).toBe(target);
    const backdrop = trigger.closest('[data-cratis-part="backdrop"]')!;
    await expect(Number(getComputedStyle(overlay).zIndex)).toBeGreaterThan(Number(getComputedStyle(backdrop).zIndex));
    await expect(getComputedStyle(picker.querySelector('.reaction-picker__quick')!).backgroundColor).toBe('rgb(12, 23, 34)');
    const choice = within(picker).getAllByRole('button')[0];
    const rect = choice.getBoundingClientRect();
    const hit = target.ownerDocument.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await expect(choice.contains(hit), `Hit ${hit?.className} instead of the emoji`).toBe(true);
    return { picker, choice };
}

export const PickersAboveStackedDialogs: Story = {
    render: () => <ScopedDialogPickers />,
    play: async ({ canvasElement }) => {
        const target = canvasElement.querySelector<HTMLElement>('[data-chat-overlay-target]')!;
        await userEvent.click(within(target).getByRole('button', { name: 'Open second chat dialog' }));
        const dialog = await within(target).findByRole('dialog', { name: 'Second chat dialog' });
        await waitFor(() => expect(getComputedStyle(dialog).opacity).toBe('1'));
        const composerToggle = within(dialog).getByRole('button', { name: 'Insert emoji' });
        await userEvent.click(composerToggle);
        const composer = await expectAnchoredPicker(target, composerToggle);
        const emoji = composer.choice.textContent!;
        target.style.transform = 'translate(44px, 26px) scale(0.9)';
        window.dispatchEvent(new Event('resize'));
        await expectAnchoredPicker(target, composerToggle);
        await userEvent.click(composer.choice);
        await expect(within(dialog).getByRole('textbox')).toHaveValue(emoji);
        await expect(target.querySelector('.reaction-picker')).toBeNull();
        const reactionToggle = within(dialog).getByRole('button', { name: 'Add a quick reaction' });
        await userEvent.click(reactionToggle);
        const reaction = await expectAnchoredPicker(target, reactionToggle);
        await userEvent.click(reaction.choice);
        await expect(within(dialog).getByLabelText('Picked reaction')).toHaveTextContent(reaction.choice.textContent!);
        await userEvent.click(reactionToggle);
        await expectAnchoredPicker(target, reactionToggle);
        await userEvent.keyboard('{Escape}');
        await expect(target.querySelector('.reaction-picker')).toBeNull();
        await expect(within(target).getByRole('dialog', { name: 'Second chat dialog' })).toBeVisible();
    },
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
