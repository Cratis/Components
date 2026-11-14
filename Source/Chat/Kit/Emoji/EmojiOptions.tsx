// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { movePickerFocus } from './movePickerFocus';

interface EmojiOptionsProps {
    emojis: readonly string[];
    ownEmoji?: string;
    label: string;
    className: string;
    optionClassName: string;
    onPick: (emoji: string) => void;
}

/** A single-tab-stop emoji list; arrow keys move focus without changing the reaction. */
export const EmojiOptions = ({ emojis, ownEmoji, label, className, optionClassName, onPick }: EmojiOptionsProps) => {
    const [active, setActive] = useState(() => Math.max(0, emojis.indexOf(ownEmoji ?? '')));
    return (
        <div role='listbox' aria-label={label} className={className} onKeyDown={movePickerFocus}>
            {emojis.map((emoji, index) => (
                <button
                    key={emoji}
                    type='button'
                    role='option'
                    data-picker-item
                    tabIndex={active === index ? 0 : -1}
                    aria-selected={emoji === ownEmoji}
                    className={`${optionClassName}${emoji === ownEmoji ? ` ${optionClassName}--selected` : ''}`}
                    onFocus={() => setActive(index)}
                    onClick={() => onPick(emoji)}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};
