// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import type { Guid } from '@cratis/fundamentals';
import { AnchoredOverlay } from './AnchoredOverlay';
import { PersonAvatarCircle, type BuildAvatarUrlParams } from './Avatar';
import { ChatAuthorKind } from './ChatAuthorKind';
import type { ChatMessage } from './ChatMessage';
import { findOwnReaction } from './findOwnReaction';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker, type ReactionPickerLabels } from './ReactionPicker';
import { reactionsExcludingUser } from './reactionsExcludingUser';
import { FaBolt, FaReply } from 'react-icons/fa6';

/** Overrides for the bubble's own labels. Any field left unset falls back to a literal English
 *  default. `{emoji}`/`{name}` placeholders are substituted by the component. */
export interface ChatMessageBubbleLabels {
    /** Tooltip/accessible label when the viewer has already reacted. Defaults to
     *  `'You reacted with {emoji}'`. */
    yourReaction?: string;
    /** Tooltip/accessible label for the reaction button before reacting. Defaults to
     *  `'Add a quick reaction'`. */
    addReaction?: string;
    /** Tooltip/accessible label for the quick-reply button. Defaults to `'Reply to {name}'`. */
    quickReplyTo?: string;
    /** Tooltip/accessible label for the "turn into an action" button. Defaults to
     *  `'Turn into an action'`. */
    convertToAction?: string;
    /** Labels forwarded to the reaction {@link ReactionPicker}. */
    reactionPicker?: ReactionPickerLabels;
}

/**
 * Props for one message bubble in a conversation, with optional quick-reaction and quick-reply
 * affordances. The affordances are opt-in via {@link currentUserId} — a conversation that does not
 * pass it renders exactly as it did before reactions existed.
 */
export interface ChatMessageBubbleProps {
    /** The message to render. */
    message: ChatMessage;

    /** Whether to show the author row above the message — false for a continuation bubble. */
    showAuthor: boolean;

    /** Whether to show the timestamp below the message. */
    showTimestamp: boolean;

    /** The formatted relative timestamp to render when {@link showTimestamp} is true. */
    formattedTimestamp: string;

    /**
     * The identifier of whoever is looking at the conversation. Reactions and quick reply are only
     * offered when this is given — a conversation whose backend cannot yet record a reaction simply
     * does not render the affordance.
     */
    currentUserId?: Guid;

    /** Invoked with the emoji picked for this message, whether given, changed, or taken back. */
    onReact?: (messageId: Guid, emoji: string) => void;

    /** Invoked to prefill the composer with a reply addressed to this message's author. */
    onQuickReply?: (authorName: string) => void;

    /**
     * Invoked to ask for what this message asks for to be carried out. Omit to leave the affordance off.
     */
    onAct?: (messageId: Guid) => void;

    /** Builds the avatar image URL. Omit to always show initials. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;

    /** Overrides for the bubble's labels. Unset fields fall back to literal English defaults. */
    labels?: ChatMessageBubbleLabels;
}

/**
 * One message in a conversation, with the optional quick-reaction and quick-reply affordances a
 * conversation may offer. The affordances are opt-in via {@link ChatMessageBubbleProps.currentUserId} —
 * a conversation that does not pass it renders exactly as it did before reactions existed.
 */
export const ChatMessageBubble = ({
    message,
    showAuthor,
    showTimestamp,
    formattedTimestamp,
    currentUserId,
    onReact,
    onQuickReply,
    onAct,
    buildAvatarUrl,
    labels,
}: ChatMessageBubbleProps) => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const reactionButtonRef = useRef<HTMLButtonElement>(null);
    const supportsReactions = !!currentUserId && !!onReact;
    const showActionsRow = supportsReactions || !!onQuickReply || !!onAct;
    const ownReaction = supportsReactions
        ? findOwnReaction(message.reactions, currentUserId)
        : undefined;
    const otherReactions = supportsReactions
        ? reactionsExcludingUser(message.reactions, currentUserId)
        : [];

    const pick = (emoji: string) => {
        setPickerOpen(false);
        onReact?.(message.id, emoji);
    };

    return (
        <div className={`chat-bubble${showAuthor ? '' : ' chat-bubble--continuation'}`}>
            {showAuthor && (
                <div className='chat-bubble-author'>
                    <PersonAvatarCircle
                        userId={message.authorId}
                        name={message.authorName}
                        hasAvatar={message.hasAvatar}
                        size={22}
                        ownerType={
                            message.authorKind === ChatAuthorKind.Agent
                                ? 'Agents'
                                : 'Users'
                        }
                        buildAvatarUrl={buildAvatarUrl}
                    />
                    <span className='chat-bubble-name'>{message.authorName}</span>
                </div>
            )}
            <div className='chat-bubble-body'>
                <div
                    className={`chat-bubble-panel${showActionsRow ? ' chat-bubble-panel--with-actions' : ''}`}
                >
                    <p className='chat-bubble-text'>{message.text}</p>
                    {showActionsRow && (
                        <div className='chat-bubble-actions'>
                            {supportsReactions && (
                                <button
                                    ref={reactionButtonRef}
                                    type='button'
                                    className={`chat-bubble-action${ownReaction ? ' chat-bubble-action--own-reaction' : ''}`}
                                    title={
                                        ownReaction
                                            ? (
                                                  labels?.yourReaction ??
                                                  'You reacted with {emoji}'
                                              ).replace('{emoji}', ownReaction.emoji)
                                            : (labels?.addReaction ??
                                              'Add a quick reaction')
                                    }
                                    aria-label={
                                        ownReaction
                                            ? (
                                                  labels?.yourReaction ??
                                                  'You reacted with {emoji}'
                                              ).replace('{emoji}', ownReaction.emoji)
                                            : (labels?.addReaction ??
                                              'Add a quick reaction')
                                    }
                                    aria-expanded={pickerOpen}
                                    onClick={() => setPickerOpen((previous) => !previous)}
                                >
                                    {ownReaction ? ownReaction.emoji : '☺'}
                                </button>
                            )}
                            {onQuickReply && (
                                <button
                                    type='button'
                                    className='chat-bubble-action'
                                    title={(
                                        labels?.quickReplyTo ?? 'Reply to {name}'
                                    ).replace('{name}', message.authorName)}
                                    aria-label={(
                                        labels?.quickReplyTo ?? 'Reply to {name}'
                                    ).replace('{name}', message.authorName)}
                                    onClick={() => onQuickReply(message.authorName)}
                                >
                                    <FaReply aria-hidden='true' />
                                </button>
                            )}
                            {onAct && (
                                <button
                                    type='button'
                                    className='chat-bubble-action'
                                    title={
                                        labels?.convertToAction ?? 'Turn into an action'
                                    }
                                    aria-label={
                                        labels?.convertToAction ?? 'Turn into an action'
                                    }
                                    onClick={() => onAct(message.id)}
                                >
                                    <FaBolt aria-hidden='true' />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {showTimestamp && (
                    <span className='chat-bubble-time'>{formattedTimestamp}</span>
                )}
                {supportsReactions && <MessageReactions reactions={otherReactions} />}
                {/* Portaled to <body> rather than positioned inside the bubble: the chat panel scrolls,
                    so a picker positioned within it is clipped the moment it reaches the panel's edge. */}
                <AnchoredOverlay
                    anchorRef={reactionButtonRef}
                    open={pickerOpen}
                    side='above'
                    align='right'
                    gap={6}
                >
                    <ReactionPicker
                        ownEmoji={ownReaction?.emoji}
                        reactions={message.reactions}
                        anchorRef={reactionButtonRef}
                        onPick={pick}
                        onDismiss={() => setPickerOpen(false)}
                        labels={labels?.reactionPicker}
                    />
                </AnchoredOverlay>
            </div>
        </div>
    );
};
