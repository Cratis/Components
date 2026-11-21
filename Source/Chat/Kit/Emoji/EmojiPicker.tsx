// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components/Tabs';
import { EmojiOptions } from './EmojiOptions';
import { useEmojiPickerFocus } from './useEmojiPickerFocus';
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
    /** Accessible label for the picker group. Defaults to `'All emojis'`. */
    allEmojis?: string;
    /** Accessible label for the emoji button group. Defaults to `'Pick an emoji'`. */
    pickEmoji?: string;
    /** Accessible label for the category tab list. Defaults to `'Emoji categories'`. */
    emojiCategories?: string;
    /** Per-category accessible names/titles. Unset categories fall back to their English name. */
    categories?: Partial<Record<EmojiCategoryKey, string>>;
}

/**
 * Props for the full emoji picker the quick row's last button opens — every emoji offered, in the
 * sections a picker is expected to have. Only the selected section is mounted.
 */
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
    const rootRef = useEmojiPickerFocus();
    const categoryLabel = (key: EmojiCategoryKey) =>
        labels?.categories?.[key] ?? DEFAULT_CATEGORY_LABELS[key];

    return (
        <div ref={rootRef} className='emoji-picker' data-cratis-component='EmojiPicker' role='group' aria-label={labels?.allEmojis ?? 'All emojis'}>
            <Tabs selectedKey={category} onSelectionChange={(key) => setCategory(key as EmojiCategoryKey)} className='emoji-picker__categories'>
                <TabList className='emoji-picker__tabs' aria-label={labels?.emojiCategories ?? 'Emoji categories'}>
                    {EMOJI_CATALOG.map((section) => (
                        <Tab
                            key={section.key}
                            id={section.key}
                            aria-label={categoryLabel(section.key)}
                            className={({ isSelected }) => `emoji-picker__tab${isSelected ? ' emoji-picker__tab--current' : ''}`}
                        >
                            <span title={categoryLabel(section.key)}>{CATEGORY_GLYPHS[section.key]}</span>
                        </Tab>
                    ))}
                </TabList>
                {EMOJI_CATALOG.map((section) => (
                    <TabPanel key={section.key} id={section.key}>
                        <EmojiOptions
                            emojis={section.emojis}
                            ownEmoji={ownEmoji}
                            columns={8}
                            label={labels?.pickEmoji ?? 'Pick an emoji'}
                            className='emoji-picker__grid'
                            optionClassName='emoji-picker__emoji'
                            onPick={onPick}
                        />
                    </TabPanel>
                ))}
            </Tabs>
        </div>
    );
};
