// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
    PersonAvatarCircle,
    type BuildAvatarUrlParams,
} from '../Canvas/shapes/ChatBubble/Avatar';
import { ChatAuthorKind } from '../Canvas/shapes/ChatBubble/ChatAuthorKind';
import {
    ChatComposer,
    type ChatComposerHandle,
    type ChatComposerLabels,
} from '../Canvas/shapes/ChatBubble/ChatComposer';
import type { ChatTypingAuthor } from '../Canvas/shapes/ChatBubble/ChatTypingAuthor';
import type { MentionCandidate } from '../Canvas/shapes/ChatBubble/Mentions';
import { TypingIndicator } from '../Canvas/shapes/ChatBubble/TypingIndicator';
import type { ChatAuthor } from './ChatAuthor';
import { chatIdentifierString, type ChatIdentifier } from './ChatIdentifier';
import type { ChatMention } from './ChatMention';
import type { ChatMessage } from './ChatMessage';
import type { ChatMessageAction } from './ChatMessageAction';
import { ChatMessageBody } from './ChatMessageBody';
import { relativeTimestamp, type RelativeTimestampLabels } from './relativeTimestamp';

const ReplyIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        aria-hidden='true'
    >
        <polyline points='9 17 4 12 9 7' />
        <path d='M4 12h10a6 6 0 0 1 6 6v1' />
    </svg>
);

/** Overrides for every label the {@link ChatConversation} renders. Any field left unset falls
 *  back to a literal English default — this library ships no i18n mechanism of its own, so a host
 *  that localizes passes its own translated strings through here. */
export interface ChatConversationLabels {
    /** Shown when there are no messages yet. Defaults to `'No messages yet. Say hello!'`. */
    empty?: string;

    /** One author typing. `{name}` is substituted. Defaults to `'{name} is typing'`. */
    typing?: string;

    /** Two authors typing. `{first}`/`{second}` are substituted. Defaults to `'{first} and {second} are typing'`. */
    typingTwo?: string;

    /** Three or more authors typing. Defaults to `'Several people are typing'`. */
    typingSeveral?: string;

    /** Tooltip/accessible label for the quick-reply button. `{name}` is substituted. Defaults to `'Reply to {name}'`. */
    quickReplyTo?: string;

    /** Overrides for the relative timestamps next to messages. */
    timestamps?: RelativeTimestampLabels;

    /** Labels forwarded to the composer. */
    composer?: ChatComposerLabels;
}

/**
 * Props for {@link ChatConversation}.
 * @typeParam TMessage The host's message type — anything extending {@link ChatMessage}.
 */
export interface ChatConversationProps<TMessage extends ChatMessage = ChatMessage> {
    /**
     * The messages of the conversation, rendered in the order given. Hand this the array a live
     * (observable) query delivers and the conversation re-renders as it changes.
     */
    messages: TMessage[];

    /**
     * Invoked when a message is sent, with the trimmed body and who it mentions. Everything else
     * about persisting the message is the host's business.
     * @param body The message text, mentions written into it as plain `@Name`.
     * @param mentions Who the body mentions.
     */
    onSendMessage: (body: string, mentions: ChatMention[]) => void;

    /**
     * Resolves an author id into what it takes to render them — name, kind, whether an avatar
     * image exists. Messages deliberately carry only the id; this is where the rest comes from.
     * Omit to fall back to rendering the id itself as the name.
     * @param authorId The identifier of the author to resolve.
     * @returns The author.
     */
    authorOf?: (authorId: ChatIdentifier) => ChatAuthor;

    /**
     * Renders the avatar for an author, replacing the built-in initials circle entirely.
     * @param authorId The identifier of the author.
     * @param author The resolved author, as {@link authorOf} answered.
     * @returns What to render.
     */
    renderAvatar?: (authorId: ChatIdentifier, author: ChatAuthor) => ReactNode;

    /**
     * Renders the display name for an author, replacing the built-in name text entirely.
     * @param authorId The identifier of the author.
     * @param author The resolved author, as {@link authorOf} answered.
     * @returns What to render.
     */
    renderAuthorName?: (authorId: ChatIdentifier, author: ChatAuthor) => ReactNode;

    /** The host's own actions, offered as buttons on every message each is available for. */
    actions?: ChatMessageAction<TMessage>[];

    /** Everyone who can be mentioned, when the host already holds the list. Omit (together with
     *  {@link resolveMentionCandidates}) to turn mentions off. */
    mentionCandidates?: MentionCandidate[];

    /**
     * Resolves who can be mentioned as the person types, invoked with what has been typed after
     * the `@`. May answer synchronously or with a promise.
     * @param query What has been typed after the `@`.
     * @returns The candidates matching the query.
     */
    resolveMentionCandidates?: (
        query: string,
    ) => MentionCandidate[] | Promise<MentionCandidate[]>;

    /** Who the conversation is currently waiting on — someone typing, or an agent working. */
    typingAuthors?: ChatTypingAuthor[];

    /** Whether the quick-reply affordance (prefill the composer with `@Name`) is offered on
     *  messages. Defaults to true. */
    quickReply?: boolean;

    /** Builds the avatar image URL for every author shown. Omit to always show initials. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;

    /** Whether the composer takes focus when mounted. */
    autoFocus?: boolean;

    /** Overrides for every label rendered. Unset fields fall back to literal English defaults. */
    labels?: ChatConversationLabels;

    /** Additional class name for the conversation's root element. */
    className?: string;
}

/** The message's timestamp as a `Date` — data that traveled through JSON may carry it as a string. */
const timestampOf = (message: ChatMessage): Date =>
    message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);

const sameMinute = (left: Date, right: Date): boolean =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate() &&
    left.getHours() === right.getHours() &&
    left.getMinutes() === right.getMinutes();

interface MessageRenderInfo {
    /** Whether to show the author row — false for a continuation by the same author. */
    showAuthor: boolean;

    /** Whether to show the timestamp — false when the next message continues the same minute. */
    showTimestamp: boolean;
}

const computeRenderInfo = (messages: ChatMessage[]): MessageRenderInfo[] =>
    messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : undefined;
        const next = index < messages.length - 1 ? messages[index + 1] : undefined;

        const showAuthor =
            !previous ||
            chatIdentifierString(previous.authorId) !==
                chatIdentifierString(message.authorId);
        const showTimestamp =
            !next ||
            chatIdentifierString(next.authorId) !==
                chatIdentifierString(message.authorId) ||
            !sameMinute(timestampOf(message), timestampOf(next));

        return { showAuthor, showTimestamp };
    });

/**
 * Composes the "X is typing" line from whoever the conversation is waiting on.
 * @param authors The authors currently typing or working.
 * @param labels Label overrides, as passed to {@link ChatConversation}.
 * @returns The label to show, empty when nobody is.
 */
const typingLabel = (
    authors: ChatTypingAuthor[],
    labels: ChatConversationLabels | undefined,
): string => {
    if (authors.length === 0) return '';
    if (authors.length === 1)
        return (labels?.typing ?? '{name} is typing').replace('{name}', authors[0].name);
    if (authors.length === 2)
        return (labels?.typingTwo ?? '{first} and {second} are typing')
            .replace('{first}', authors[0].name)
            .replace('{second}', authors[1].name);
    return labels?.typingSeveral ?? 'Several people are typing';
};

/**
 * One conversation — its messages and the composer to add to them. Host-agnostic by design: it
 * renders whatever message array it is given (hand it a live query's data and it stays current),
 * resolves authors through the host's {@link ChatConversationProps.authorOf | authorOf} and
 * render callbacks, offers the host's own {@link ChatConversationProps.actions | actions} on
 * each message, and reports sends back through
 * {@link ChatConversationProps.onSendMessage | onSendMessage} without any opinion about the
 * backend behind it. Mentions and the emoji picker come along through the composer.
 */
export const ChatConversation = <TMessage extends ChatMessage = ChatMessage>({
    messages,
    onSendMessage,
    authorOf,
    renderAvatar,
    renderAuthorName,
    actions,
    mentionCandidates,
    resolveMentionCandidates,
    typingAuthors = [],
    quickReply = true,
    buildAvatarUrl,
    autoFocus = false,
    labels,
    className,
}: ChatConversationProps<TMessage>) => {
    const composerRef = useRef<ChatComposerHandle>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const renderInfo = useMemo(() => computeRenderInfo(messages), [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, typingAuthors.length]);

    const authorFor = (authorId: ChatIdentifier): ChatAuthor =>
        authorOf?.(authorId) ?? {
            name: chatIdentifierString(authorId),
            kind: ChatAuthorKind.User,
        };

    const send = (text: string, mentioned: MentionCandidate[]) =>
        onSendMessage(
            text,
            mentioned.map(
                (candidate) =>
                    ({
                        id: candidate.id,
                        name: candidate.name,
                        kind: candidate.kind,
                    }) satisfies ChatMention,
            ),
        );

    const quickReplyTo = (name: string) => composerRef.current?.prefill(`@${name} `);

    return (
        <div className={`cratis-chat-conversation${className ? ` ${className}` : ''}`}>
            <div className='cratis-chat-conversation__messages'>
                {messages.length === 0 && (
                    <p className='cratis-chat-conversation__empty'>
                        {labels?.empty ?? 'No messages yet. Say hello!'}
                    </p>
                )}
                {messages.map((message, index) => {
                    const author = authorFor(message.authorId);
                    const { showAuthor, showTimestamp } = renderInfo[index];
                    const availableActions = (actions ?? []).filter(
                        (action) => action.isAvailable?.(message) ?? true,
                    );
                    const showActionsRow = quickReply || availableActions.length > 0;

                    return (
                        <div
                            key={chatIdentifierString(message.id)}
                            className={`cratis-chat-message${showAuthor ? '' : ' cratis-chat-message--continuation'}`}
                        >
                            {showAuthor && (
                                <div className='cratis-chat-message__author'>
                                    {renderAvatar ? (
                                        renderAvatar(message.authorId, author)
                                    ) : (
                                        <PersonAvatarCircle
                                            userId={chatIdentifierString(
                                                message.authorId,
                                            )}
                                            name={author.name}
                                            hasAvatar={author.hasAvatar ?? false}
                                            size={22}
                                            ownerType={
                                                author.kind === ChatAuthorKind.Agent
                                                    ? 'Agents'
                                                    : 'Users'
                                            }
                                            version={author.avatarVersion}
                                            buildAvatarUrl={buildAvatarUrl}
                                        />
                                    )}
                                    <span className='cratis-chat-message__author-name'>
                                        {renderAuthorName
                                            ? renderAuthorName(message.authorId, author)
                                            : author.name}
                                    </span>
                                </div>
                            )}
                            <div className='cratis-chat-message__content'>
                                <div
                                    className={`cratis-chat-message__panel${showActionsRow ? ' cratis-chat-message__panel--with-actions' : ''}`}
                                >
                                    <ChatMessageBody
                                        body={message.body}
                                        mentions={message.mentions}
                                    />
                                    {showActionsRow && (
                                        <div className='cratis-chat-message__actions'>
                                            {quickReply && (
                                                <button
                                                    type='button'
                                                    className='cratis-chat-message__action'
                                                    title={(
                                                        labels?.quickReplyTo ??
                                                        'Reply to {name}'
                                                    ).replace('{name}', author.name)}
                                                    aria-label={(
                                                        labels?.quickReplyTo ??
                                                        'Reply to {name}'
                                                    ).replace('{name}', author.name)}
                                                    onClick={() =>
                                                        quickReplyTo(author.name)
                                                    }
                                                >
                                                    <ReplyIcon />
                                                </button>
                                            )}
                                            {availableActions.map((action) => (
                                                <button
                                                    key={action.id}
                                                    type='button'
                                                    className='cratis-chat-message__action'
                                                    title={action.label}
                                                    aria-label={action.label}
                                                    onClick={() =>
                                                        action.onInvoke(message)
                                                    }
                                                >
                                                    {typeof action.icon === 'string' ? (
                                                        <i
                                                            className={action.icon}
                                                            aria-hidden='true'
                                                        />
                                                    ) : (
                                                        action.icon
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {showTimestamp && (
                                    <span className='cratis-chat-message__time'>
                                        {relativeTimestamp(
                                            timestampOf(message),
                                            new Date(),
                                            labels?.timestamps,
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                <TypingIndicator
                    authors={typingAuthors}
                    label={typingLabel(typingAuthors, labels)}
                    buildAvatarUrl={buildAvatarUrl}
                />
                <div ref={messagesEndRef} />
            </div>

            <ChatComposer
                ref={composerRef}
                mentionCandidates={mentionCandidates}
                resolveMentionCandidates={resolveMentionCandidates}
                onSend={send}
                autoFocus={autoFocus}
                buildAvatarUrl={buildAvatarUrl}
                labels={labels?.composer}
            />
        </div>
    );
};
