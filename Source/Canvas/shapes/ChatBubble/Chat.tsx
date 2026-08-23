// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useEffect, useMemo, useRef } from 'react';
import type { Guid } from '@cratis/fundamentals';
import type { BuildAvatarUrlParams } from './Avatar';
import { ChatComposer, type ChatComposerHandle, type ChatComposerLabels } from './ChatComposer';
import { ChatMessageBubble, type ChatMessageBubbleLabels } from './ChatMessageBubble';
import type { ChatMessage } from './ChatMessage';
import type { ChatTypingAuthor } from './ChatTypingAuthor';
import { ChatVariant } from './ChatVariant';
import { FailedReply, type FailedReplyLabels, type FailedReplyReportDetails } from './FailedReply';
import type { MentionCandidate } from './Mentions';
import { TypingIndicator } from './TypingIndicator';

/** Overrides for every label the {@link Chat} panel and its children render. Any field left unset
 *  falls back to a literal English default — this library ships no i18n mechanism of its own, so a
 *  host that localizes passes its own translated strings through here. */
export interface ChatLabels {
    /** The panel's own title, shown when not {@link ChatVariant.Docked}. Defaults to `'Comments'`. */
    title?: string;
    /** Tooltip for the close button. Defaults to `'Close'`. */
    close?: string;
    /** Accessible label for the close button. Defaults to `'Close panel'`. */
    closePanel?: string;
    /** Shown when there are no messages yet. Defaults to `'No comments yet. Be the first!'`. */
    noComments?: string;
    /** One author typing. `{name}` is substituted. Defaults to `'{name} is typing'`. */
    typing?: string;
    /** Two authors typing. `{first}`/`{second}` are substituted. Defaults to `'{first} and {second} are typing'`. */
    typingTwo?: string;
    /** Three or more authors typing. Defaults to `'Several people are typing'`. */
    typingSeveral?: string;
    /** Labels forwarded to the {@link ChatComposer}. */
    composer?: ChatComposerLabels;
    /** Labels forwarded to every {@link ChatMessageBubble}. */
    messageBubble?: ChatMessageBubbleLabels;
    /** Labels forwarded to every {@link FailedReply}. */
    failedReply?: FailedReplyLabels;
}

export interface ChatProps {

    messages: ChatMessage[];

    onSend: (text: string) => void;

    onClose: () => void;

    title?: string;

    autoFocus?: boolean;

    /**
     * How the conversation is presented. Docked leaves the frame and heading to whatever contains
     * it, which is what a chat sidebar provides.
     */
    variant?: ChatVariant;

    /** Everyone who can be mentioned from this conversation. Omit to turn mentions off. */
    mentionCandidates?: MentionCandidate[];

    /** Who the conversation is currently waiting on — someone typing, or an agent working. */
    typingAuthors?: ChatTypingAuthor[];

    /**
     * The identifier of whoever is looking at the conversation. Reactions are only offered when this
     * is given, together with {@link onReact} — a conversation whose backend cannot yet record a
     * reaction simply does not render the affordance.
     */
    currentUserId?: Guid;

    /** Invoked with the message reacted to and the emoji picked, whether given, changed, or taken back. */
    onReact?: (messageId: Guid, emoji: string) => void;

    /**
     * Invoked with the message somebody asked to have carried out. Omit to leave the affordance off — a
     * conversation whose subject is not something the host can act on does not offer it.
     */
    onAct?: (messageId: Guid) => void;

    /**
     * Decides which messages {@link ChatProps.onAct} is offered on. Omit to offer it on all of them.
     */
    canAct?: (message: ChatMessage) => boolean;

    /** Builds the avatar image URL for every author shown in the panel. Omit to always show initials. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;

    /**
     * Builds the href for a failed turn's "report this" link. Omit to hide the report action on every
     * {@link FailedReply} line — see {@link FailedReplyProps.buildReportUrl}.
     */
    buildReportUrl?: (details: FailedReplyReportDetails) => string;

    /** Overrides for every label the panel and its children render. Unset fields fall back to
     *  literal English defaults. */
    labels?: ChatLabels;
}

function formatTimestamp(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60_000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function sameMinute(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate() &&
        a.getHours() === b.getHours() &&
        a.getMinutes() === b.getMinutes()
    );
}

interface MessageRenderInfo {

    showAuthor: boolean;

    showTimestamp: boolean;
}

function computeRenderInfo(messages: ChatMessage[]): MessageRenderInfo[] {
    return messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : null;
        const next = index < messages.length - 1 ? messages[index + 1] : null;

        const showAuthor = !previous || previous.authorName !== message.authorName;

        const showTimestamp =
            !next ||
            next.authorName !== message.authorName ||
            !sameMinute(message.timestamp, next.timestamp);

        return { showAuthor, showTimestamp };
    });
}

/**
 * Composes the "X is typing" line from whoever the conversation is waiting on.
 * @param authors The authors currently typing or working.
 * @param labels Label overrides, as passed to {@link Chat}.
 * @returns The label to show, empty when nobody is.
 */
function typingLabel(authors: ChatTypingAuthor[], labels: ChatLabels | undefined): string {
    if (authors.length === 0) return '';
    if (authors.length === 1) return (labels?.typing ?? '{name} is typing').replace('{name}', authors[0].name);
    if (authors.length === 2) return (labels?.typingTwo ?? '{first} and {second} are typing').replace('{first}', authors[0].name).replace('{second}', authors[1].name);
    return labels?.typingSeveral ?? 'Several people are typing';
}

export const Chat: React.FC<ChatProps> = ({
    messages,
    onSend,
    onClose,
    title,
    autoFocus = false,
    variant = ChatVariant.Floating,
    mentionCandidates,
    typingAuthors = [],
    currentUserId,
    onReact,
    onAct,
    canAct,
    buildAvatarUrl,
    buildReportUrl,
    labels,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const composerRef = useRef<ChatComposerHandle>(null);
    const renderInfo = useMemo(() => computeRenderInfo(messages), [messages]);
    const isDocked = variant === ChatVariant.Docked;
    const resolvedTitle = title ?? labels?.title ?? 'Comments';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, typingAuthors.length]);

    const quickReply = (authorName: string) => composerRef.current?.prefill(`@${authorName} `);

    return (
        <div className={`chat-panel${isDocked ? ' chat-panel--docked' : ''}`} onClick={event => event.stopPropagation()}>
            {!isDocked && (
                <div className='chat-panel-header'>
                    <span className='chat-panel-title'>{resolvedTitle}</span>
                    <button
                        className='chat-panel-close'
                        onClick={onClose}
                        title={labels?.close ?? 'Close'}
                        aria-label={labels?.closePanel ?? 'Close panel'}
                    >
                        ×
                    </button>
                </div>
            )}

            <div className='chat-panel-messages'>
                {messages.length === 0 && (
                    <p className='chat-panel-empty'>{labels?.noComments ?? 'No comments yet. Be the first!'}</p>
                )}
                {messages.map((message, index) => {
                    // A turn that ended in failure is not something its author said, so it never becomes
                    // a bubble — it stands where the answer would have been and says so.
                    if (message.failureDetail !== undefined) {
                        return <FailedReply key={message.id.toString()} message={message} buildReportUrl={buildReportUrl} labels={labels?.failedReply} />;
                    }

                    const { showAuthor, showTimestamp } = renderInfo[index];
                    return (
                        <ChatMessageBubble
                            key={message.id.toString()}
                            message={message}
                            showAuthor={showAuthor}
                            showTimestamp={showTimestamp}
                            formattedTimestamp={formatTimestamp(message.timestamp)}
                            currentUserId={currentUserId}
                            onReact={onReact}
                            onQuickReply={quickReply}
                            onAct={onAct && (canAct?.(message) ?? true) ? onAct : undefined}
                            buildAvatarUrl={buildAvatarUrl}
                            labels={labels?.messageBubble}
                        />
                    );
                })}
                <TypingIndicator authors={typingAuthors} label={typingLabel(typingAuthors, labels)} buildAvatarUrl={buildAvatarUrl} />
                <div ref={messagesEndRef} />
            </div>

            <ChatComposer
                ref={composerRef}
                mentionCandidates={mentionCandidates}
                onSend={onSend}
                autoFocus={autoFocus}
                buildAvatarUrl={buildAvatarUrl}
                labels={labels?.composer}
            />
        </div>
    );
};
