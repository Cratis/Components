// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import { AnchoredOverlay } from './AnchoredOverlay';
import type { ChatMessageReaction } from './ChatMessageReaction';

const MAX_STACKED_GLYPHS = 3;

/**
 * Props for the row of emoji badges a message's reactions render as, sitting below the message text.
 * Each badge says who is behind it on hover, emoji on the left and name on the right, one line per person.
 */
export interface MessageReactionsProps {
    /**
     * The reactions to render, one badge per distinct emoji. Several people behind the same emoji
     * render as a stack rather than repeating the glyph; a different emoji gets its own badge on the
     * line.
     */
    reactions: ChatMessageReaction[];
}

interface ReactionBadgeProps {
    /** The reaction this badge stands for. */
    reaction: ChatMessageReaction;
}

/**
 * One emoji's badge. Who gave it is shown on hover — that is the whole mechanism, so there is nothing
 * to discover and nothing extra to click. Clicking pins the same list open, which is what makes it
 * reachable on a touch screen, where there is no hover to rely on.
 */
const ReactionBadge = ({ reaction }: ReactionBadgeProps) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

    return (
        <div
            ref={anchorRef}
            className='message-reactions__badge-wrapper'
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                type='button'
                className='message-reactions__badge'
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
                onClick={() => setIsPinned((pinned) => !pinned)}
            >
                <span className='message-reactions__stack'>
                    {reaction.users.slice(0, MAX_STACKED_GLYPHS).map((user, index) => (
                        <span
                            key={user.id.toString()}
                            className='message-reactions__glyph'
                            style={{ zIndex: MAX_STACKED_GLYPHS - index }}
                        >
                            {reaction.emoji}
                        </span>
                    ))}
                </span>
                {reaction.users.length > 1 && (
                    <span className='message-reactions__count'>
                        {reaction.users.length}
                    </span>
                )}
            </button>
            {/* Portaled rather than positioned inside the bubble: the chat panel scrolls, and anything
                positioned within it is clipped the moment it reaches the panel's edge. */}
            <AnchoredOverlay
                anchorRef={anchorRef}
                open={isHovered || isPinned}
                side='above'
                align='left'
                gap={6}
            >
                <div className='message-reactions__tooltip' role='tooltip'>
                    {reaction.users.map((user) => (
                        <div
                            key={user.id.toString()}
                            className='message-reactions__tooltip-row'
                        >
                            <span className='message-reactions__tooltip-emoji'>
                                {reaction.emoji}
                            </span>
                            <span className='message-reactions__tooltip-name'>
                                {user.name}
                            </span>
                        </div>
                    ))}
                </div>
            </AnchoredOverlay>
        </div>
    );
};

/**
 * The row of emoji badges a message's reactions render as, sitting below the message text. Each badge
 * says who is behind it on hover, emoji on the left and name on the right, one line per person.
 */
export const MessageReactions = ({ reactions }: MessageReactionsProps) => {
    if (reactions.length === 0) return null;

    return (
        <div className='message-reactions'>
            {reactions.map((reaction) => (
                <ReactionBadge key={reaction.emoji} reaction={reaction} />
            ))}
        </div>
    );
};
