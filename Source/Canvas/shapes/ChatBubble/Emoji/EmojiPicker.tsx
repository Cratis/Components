// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import { EMOJI_CATALOG } from './emojiCatalog';
import { EmojiCategoryKey } from './EmojiCategoryKey';

/** The tab glyph for each section — the picker's own labels are its icons, as pickers of this kind are. */
const CATEGORY_GLYPHS: Record<EmojiCategoryKey, string> = {
    [EmojiCategoryKey.Smileys]: '😀',
    [EmojiCategoryKey.People]: '👋',
    [EmojiCategoryKey.Nature]: '🐻',
    [EmojiCategoryKey.Food]: '🍔',
    [EmojiCategoryKey.Activity]: '⚽',
    [EmojiCategoryKey.Travel]: '🚗',
    [EmojiCategoryKey.Objects]: '💡',
    [EmojiCategoryKey.Symbols]: '❤️',
    [EmojiCategoryKey.Flags]: '🏳️',
};

/** The literal English defaults for each category's accessible name/title, used when
 *  {@link EmojiPickerLabels.categories} does not override a given key. */
const DEFAULT_CATEGORY_LABELS: Record<EmojiCategoryKey, string> = {
    [EmojiCategoryKey.Smileys]: 'Smileys',
    [EmojiCategoryKey.People]: 'People',
    [EmojiCategoryKey.Nature]: 'Animals & nature',
    [EmojiCategoryKey.Food]: 'Food & drink',
    [EmojiCategoryKey.Activity]: 'Activity',
    [EmojiCategoryKey.Travel]: 'Travel & places',
    [EmojiCategoryKey.Objects]: 'Objects',
    [EmojiCategoryKey.Symbols]: 'Symbols',
    [EmojiCategoryKey.Flags]: 'Flags',
};

/** Overrides for the picker's labels. Any field left unset falls back to a literal English default. */
export interface EmojiPickerLabels {
    /** Accessible label for the picker dialog. Defaults to `'All emojis'`. */
    allEmojis?: string;
    /** Accessible label for the emoji grid. Defaults to `'Pick an emoji'`. */
    pickEmoji?: string;
    /** Accessible label for the category tab list. Defaults to `'Emoji categories'`. */
    emojiCategories?: string;
    /** Per-category accessible names/titles. Unset categories fall back to their English name. */
    categories?: Partial<Record<EmojiCategoryKey, string>>;
}

export interface EmojiPickerProps {

    /** The emoji the viewer already gave, marked so picking it again reads as taking it back. */
    ownEmoji?: string;

    /** Invoked with the emoji that was picked. */
    onPick: (emoji: string) => void;

    /** Overrides for the picker's labels. Unset fields fall back to literal English defaults. */
    labels?: EmojiPickerLabels;
}

/**
 * The full emoji picker the quick row's last button opens — every emoji offered, in the sections a
 * picker is expected to have.
 *
 * Only the selected section is mounted. A thousand buttons at once is what makes a picker of this kind
 * feel slow to open, and there is never more than one section on screen to look at anyway.
 */
export const EmojiPicker = ({ ownEmoji, onPick, labels }: EmojiPickerProps) => {
    const [category, setCategory] = useState(EmojiCategoryKey.Smileys);
    const gridRef = useRef<HTMLDivElement>(null);

    const showCategory = (key: EmojiCategoryKey) => {
        setCategory(key);
        gridRef.current?.scrollTo({ top: 0 });
    };

    const emojis = EMOJI_CATALOG.find(section => section.key === category)?.emojis ?? [];
    const categoryLabel = (key: EmojiCategoryKey) => labels?.categories?.[key] ?? DEFAULT_CATEGORY_LABELS[key];

    return (
        <div className='emoji-picker' role='dialog' aria-label={labels?.allEmojis ?? 'All emojis'}>
            <div ref={gridRef} className='emoji-picker__grid' role='listbox' aria-label={labels?.pickEmoji ?? 'Pick an emoji'}>
                {emojis.map(emoji => (
                    <button
                        key={emoji}
                        type='button'
                        role='option'
                        aria-selected={emoji === ownEmoji}
                        className={`emoji-picker__emoji${emoji === ownEmoji ? ' emoji-picker__emoji--selected' : ''}`}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => onPick(emoji)}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <div className='emoji-picker__tabs' role='tablist' aria-label={labels?.emojiCategories ?? 'Emoji categories'}>
                {EMOJI_CATALOG.map(section => (
                    <button
                        key={section.key}
                        type='button'
                        role='tab'
                        aria-selected={section.key === category}
                        aria-label={categoryLabel(section.key)}
                        title={categoryLabel(section.key)}
                        className={`emoji-picker__tab${section.key === category ? ' emoji-picker__tab--current' : ''}`}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => showCategory(section.key)}
                    >
                        {CATEGORY_GLYPHS[section.key]}
                    </button>
                ))}
            </div>
        </div>
    );
};
