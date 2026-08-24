// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { RefObject, useEffect, useRef, useState } from 'react';
import { EmojiPicker, type EmojiPickerLabels } from './Emoji/EmojiPicker';
import { recentEmojis, rememberEmoji } from './Emoji/recentEmojis';
import type { EmojiMemory } from './Emoji/EmojiMemory';
import type { ChatMessageReaction } from './ChatMessageReaction';

/** Overrides for the picker's own labels. Any field left unset falls back to a literal English
 *  default. */
export interface ReactionPickerLabels {
    /** Accessible label for the quick row. Defaults to `'Pick an emoji'`. */
    pickEmoji?: string;
    /** Tooltip/accessible label for the "more" button that opens the full picker. Defaults to
     *  `'All emojis'`. */
    allEmojis?: string;
    /** Labels forwarded to the full {@link EmojiPicker} when it is opened. */
    emojiPicker?: EmojiPickerLabels;
}

/**
 * Props for the popover a reaction button opens: the emojis this person reached for most recently,
 * and a muted button at the end that opens the full picker — the shape Apple's tapback bar established,
 * where the quick row answers almost every reaction and the rest is one click further away.
 */
export interface ReactionPickerProps {
    /** The emoji the viewer already gave, highlighted so picking it again reads as "remove". */
    ownEmoji?: string;

    /**
     * The reactions already on the message. Shown as a list of who gave what underneath the quick row,
     * so somebody opening the picker can see where the message stands without a second gesture.
     */
    reactions?: readonly ChatMessageReaction[];

    /**
     * Where the recently used emojis are remembered. Defaults to the browser's local storage; a spec
     * (or a host without storage) can pass its own.
     */
    memory?: EmojiMemory;

    /**
     * The button that opened the picker. A click on it is that button's business — without this the
     * picker would dismiss on the way down and the button would reopen it on the way up, leaving a
     * toggle that never closes.
     */
    anchorRef?: RefObject<HTMLElement | null>;

    /** Invoked with the emoji that was picked. */
    onPick: (emoji: string) => void;

    /** Invoked when the picker should close without a pick (an outside click, or Escape). */
    onDismiss: () => void;

    /** Overrides for the picker's labels. Unset fields fall back to literal English defaults. */
    labels?: ReactionPickerLabels;
}

/**
 * The popover a reaction button opens: the emojis this person reached for most recently, and a muted
 * button at the end that opens the full picker — the shape Apple's tapback bar established, where the
 * quick row answers almost every reaction and the rest is one click further away.
 *
 * Picking the emoji already given is how a reaction is taken back; the caller decides
 * give/change/revoke from what was clicked.
 */
export const ReactionPicker = ({
    ownEmoji,
    reactions = [],
    memory,
    anchorRef,
    onPick,
    onDismiss,
    labels,
}: ReactionPickerProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const store =
        memory ?? (typeof window === 'undefined' ? undefined : window.localStorage);
    const [quickEmojis, setQuickEmojis] = useState(() =>
        store ? recentEmojis(store) : [],
    );
    const [showingAll, setShowingAll] = useState(false);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (rootRef.current?.contains(target) || anchorRef?.current?.contains(target))
                return;
            onDismiss();
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onDismiss();
        };

        // Capture phase, so board items that stop pointerdown propagation for their own
        // gestures still dismiss the picker.
        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onDismiss, anchorRef]);

    const pick = (emoji: string) => {
        // Remembered before it is handed on: the caller closes the picker, and the row has to already
        // be in its new order the next time it opens.
        if (store) setQuickEmojis(rememberEmoji(store, emoji));
        onPick(emoji);
    };

    return (
        <div ref={rootRef} className='reaction-picker'>
            <div
                className='reaction-picker__quick'
                role='listbox'
                aria-label={labels?.pickEmoji ?? 'Pick an emoji'}
            >
                {quickEmojis.map((emoji) => (
                    <button
                        key={emoji}
                        type='button'
                        role='option'
                        aria-selected={emoji === ownEmoji}
                        className={`reaction-picker__item${emoji === ownEmoji ? ' reaction-picker__item--selected' : ''}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pick(emoji)}
                    >
                        {emoji}
                    </button>
                ))}
                <button
                    type='button'
                    className={`reaction-picker__more${showingAll ? ' reaction-picker__more--open' : ''}`}
                    title={labels?.allEmojis ?? 'All emojis'}
                    aria-label={labels?.allEmojis ?? 'All emojis'}
                    aria-expanded={showingAll}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setShowingAll((open) => !open)}
                >
                    ☺
                </button>
            </div>
            {showingAll && (
                <EmojiPicker
                    ownEmoji={ownEmoji}
                    onPick={pick}
                    labels={labels?.emojiPicker}
                />
            )}
            {!showingAll && reactions.length > 0 && (
                <div className='reaction-picker__given'>
                    {reactions.flatMap((reaction) =>
                        reaction.users.map((user) => (
                            <div
                                key={`${reaction.emoji}-${user.id.toString()}`}
                                className='reaction-picker__given-row'
                            >
                                <span className='reaction-picker__given-emoji'>
                                    {reaction.emoji}
                                </span>
                                <span className='reaction-picker__given-name'>
                                    {user.name}
                                </span>
                            </div>
                        )),
                    )}
                </div>
            )}
        </div>
    );
};
