// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { EmojiMemory } from './EmojiMemory';

/**
 * What the quick row offers before anybody has reacted with anything — the handful a conversation
 * reaches for on its first day, so the row is never empty and never has to be learned first.
 */
export const DEFAULT_EMOJIS: readonly string[] = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

/** How many the quick row holds; past this the least recently used drops off the end. */
export const QUICK_ROW_SIZE = 6;

const STORAGE_KEY = 'studio.chat.recent-emojis';

/**
 * The emojis to offer in the quick row: the ones this person reached for most recently, newest first,
 * topped up with the defaults so the row is always full rather than shrinking to whatever has been
 * used so far.
 * @param memory Where the history is kept.
 * @returns The emojis to offer, most recently used first.
 */
export function recentEmojis(memory: EmojiMemory): string[] {
    return topUp(readHistory(memory));
}

/**
 * Records that an emoji was used, moving it to the front of the history.
 * @param memory Where the history is kept.
 * @param emoji The emoji that was used.
 * @returns The emojis to offer from now on, most recently used first.
 */
export function rememberEmoji(memory: EmojiMemory, emoji: string): string[] {
    const history = [emoji, ...readHistory(memory).filter(used => used !== emoji)].slice(0, QUICK_ROW_SIZE);

    // Storage is a courtesy, not a requirement — a browser refusing to write (private mode, a full
    // quota) must not cost somebody the reaction they were in the middle of giving.
    try {
        memory.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.warn('Could not remember the emoji that was just used.', error);
    }

    return topUp(history);
}

/** The stored history, or nothing at all when it is missing or no longer readable as one. */
function readHistory(memory: EmojiMemory): string[] {
    try {
        const stored = memory.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed: unknown = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
    } catch (error) {
        console.warn('Could not read which emojis were used recently.', error);
        return [];
    }
}

/** Fills the row out with defaults, keeping the used ones in front and never repeating one. */
function topUp(history: readonly string[]): string[] {
    return [...new Set([...history, ...DEFAULT_EMOJIS])].slice(0, QUICK_ROW_SIZE);
}
