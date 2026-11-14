// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { movePickerFocus } from './movePickerFocus';

interface EmojiOptionsProps {
    emojis: readonly string[];
    ownEmoji?: string;
    columns?: number;
    label: string;
    className: string;
    optionClassName: string;
    onPick: (emoji: string) => void;
}

/** A single-tab-stop group of emoji actions; item updates retain a valid focus entry. */
export const EmojiOptions = ({ emojis, ownEmoji, columns = 1, label, className, optionClassName, onPick }: EmojiOptionsProps) => {
    const [focusedEmoji, setFocusedEmoji] = useState(ownEmoji);
    const active = emojis.includes(focusedEmoji ?? '') ? focusedEmoji : emojis[0];
    return (
        <div role='group' aria-label={label} className={className} onKeyDown={(event) => movePickerFocus(event, columns)}>
            {emojis.map((emoji) => (
                <button
                    key={emoji}
                    type='button'
                    data-picker-item
                    tabIndex={active === emoji ? 0 : -1}
                    aria-pressed={emoji === ownEmoji}
                    className={`${optionClassName}${emoji === ownEmoji ? ` ${optionClassName}--selected` : ''}`}
                    onFocus={() => setFocusedEmoji(emoji)}
                    onClick={() => onPick(emoji)}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};
