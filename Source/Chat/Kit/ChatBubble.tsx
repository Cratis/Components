// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Guid } from '@cratis/fundamentals';
import { PersonAvatarCircle, getAvatarColor, type BuildAvatarUrlParams } from './Avatar';

const FONT: React.CSSProperties = { fontFamily: 'system-ui, sans-serif' };
const PREVIEW_AUTHOR_NAME_MAX_LENGTH = 14;
const PREVIEW_MESSAGE_MAX_LENGTH = 60;

function formatTimestamp(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60_000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Props for a canvas-rendered chat bubble avatar with hover preview and optional thinking indicator.
 * Shows the author's avatar circle with an optional selection ring, animated thinking dots, and a
 * hover card previewing the conversation state.
 */
export interface ChatBubbleProps {
    /** The identifier of the person this bubble represents. */
    authorId: Guid | string;

    /** The person's display name, used for the avatar and preview. */
    authorName: string;

    /** Whether the person has an uploaded avatar image. */
    hasAvatar: boolean;

    /** The avatar circle's diameter in pixels. Defaults to `56`. */
    size?: number;

    /** Whether to suppress the hover preview card. Defaults to `false`. */
    suppressPreview?: boolean;

    /** The most recent message text shown in the preview. */
    previewMessage?: string;

    /** The timestamp of the most recent message shown in the preview. */
    previewTimestamp?: Date;

    /** The number of replies shown in the preview. */
    replyCount?: number;

    /** Whether to show the animated thinking-bubble indicator. Defaults to `false`. */
    showThinkingBubbles?: boolean;

    /** Whether to show the selection ring around the avatar. Defaults to `false`. */
    selected?: boolean;

    /** Builds the avatar image URL. Omit to always show initials — see {@link PersonAvatarCircleProps}. */
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;
}

/**
 * A canvas-rendered chat bubble avatar with hover preview and optional thinking indicator. Shows
 * the author's avatar circle with an optional selection ring, animated thinking dots trailing
 * down-right, and a hover card previewing the conversation state.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
    authorId,
    authorName,
    hasAvatar,
    size = 56,
    suppressPreview = false,
    previewMessage,
    previewTimestamp,
    replyCount,
    showThinkingBubbles = false,
    selected = false,
    buildAvatarUrl,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    // The thinking dots always use the person's deterministic color, even when an avatar image is
    // shown, so they stay visually tied to the person rather than picking up an unrelated color.
    const color = getAvatarColor(authorId.toString());

    // Thinking-bubble animation state
    const [dotsVisible, setDotsVisible] = useState(showThinkingBubbles);
    const [dotsExiting, setDotsExiting] = useState(false);
    const previousShowBubbles = useRef(false);

    useEffect(() => {
        if (showThinkingBubbles && !previousShowBubbles.current) {
            setDotsExiting(false);
            setDotsVisible(true);
        } else if (!showThinkingBubbles && previousShowBubbles.current) {
            setDotsExiting(true);
        }
        previousShowBubbles.current = showThinkingBubbles;
    }, [showThinkingBubbles]);

    const handleDotsAnimationEnd = () => {
        if (dotsExiting) {
            setDotsVisible(false);
            setDotsExiting(false);
        }
    };

    const dotSize1 = Math.max(8, Math.round(size * 0.2));
    const dotSize2 = Math.max(5, Math.round(size * 0.12));

    return (
        <div
            style={{ position: 'relative', width: size, height: size }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Avatar circle */}
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    boxShadow: selected
                        ? `inset 0 0 0 3px var(--cratis-primary-color), 0 4px 12px rgba(0, 0, 0, 0.22)`
                        : '0 4px 12px rgba(0, 0, 0, 0.22)',
                    position: 'relative',
                }}
            >
                <PersonAvatarCircle
                    userId={authorId}
                    name={authorName}
                    hasAvatar={hasAvatar}
                    size={size}
                    avatarSize='Medium'
                    buildAvatarUrl={buildAvatarUrl}
                />
            </div>

            {/* Animated thinking bubbles trailing down-right */}
            {dotsVisible && (
                <div
                    className={`thinking-bubbles ${dotsExiting ? 'thinking-bubbles--exiting' : 'thinking-bubbles--entering'}`}
                    onAnimationEnd={handleDotsAnimationEnd}
                    aria-hidden='true'
                >
                    <div
                        className='thinking-dot thinking-dot--1'
                        style={{
                            width: dotSize1,
                            height: dotSize1,
                            background: color,
                            top: Math.round(size * 0.94),
                            left: Math.round(size * 0.82),
                        }}
                    />
                    <div
                        className='thinking-dot thinking-dot--2'
                        style={{
                            width: dotSize2,
                            height: dotSize2,
                            background: color,
                            top: Math.round(size * 1.22),
                            left: Math.round(size * 1.02),
                        }}
                    />
                </div>
            )}

            {/* Hover preview card */}
            {isHovered && !suppressPreview && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '100%',
                        marginLeft: 14,
                        transform: 'translateY(-50%)',
                        width: 224,
                        background: 'var(--cratis-surface-card)',
                        border: '1px solid var(--cratis-surface-border)',
                        borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
                        padding: '10px 12px',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        pointerEvents: 'none',
                        zIndex: 9999,
                    }}
                >
                    {/* Avatar in preview */}
                    <PersonAvatarCircle
                        userId={authorId}
                        name={authorName}
                        hasAvatar={hasAvatar}
                        size={30}
                        buildAvatarUrl={buildAvatarUrl}
                    />

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 6,
                                marginBottom: 3,
                                flexWrap: 'wrap',
                            }}
                        >
                            <span
                                style={{
                                    ...FONT,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--cratis-text-color)',
                                }}
                            >
                                {authorName.length > PREVIEW_AUTHOR_NAME_MAX_LENGTH
                                    ? `${authorName.slice(0, PREVIEW_AUTHOR_NAME_MAX_LENGTH)}…`
                                    : authorName}
                            </span>
                            {previewTimestamp && (
                                <span
                                    style={{
                                        ...FONT,
                                        fontSize: 10,
                                        color: 'var(--cratis-text-color-secondary)',
                                    }}
                                >
                                    {formatTimestamp(previewTimestamp)}
                                </span>
                            )}
                        </div>
                        <p
                            style={{
                                ...FONT,
                                fontSize: 11,
                                color: 'var(--cratis-text-color)',
                                margin: '0 0 6px',
                                lineHeight: 1.4,
                            }}
                        >
                            {previewMessage
                                ? previewMessage.length > PREVIEW_MESSAGE_MAX_LENGTH
                                    ? `${previewMessage.slice(0, PREVIEW_MESSAGE_MAX_LENGTH)}…`
                                    : previewMessage
                                : 'No messages yet'}
                        </p>
                        {replyCount !== undefined && replyCount > 0 && (
                            <span
                                style={{
                                    ...FONT,
                                    fontSize: 10,
                                    color: 'var(--cratis-primary-color)',
                                }}
                            >
                                {replyCount === 1 ? '1 reply' : `${replyCount} replies`}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
