// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Where a person's recently used emojis are kept between visits. Narrowed to the two calls that are
 * actually needed so the picker never reaches for browser storage itself, and a spec can hand it a
 * plain object instead.
 */
export interface EmojiMemory {

    /** Reads a stored value, or null when nothing has been stored under the key. */
    getItem(key: string): string | null;

    /** Stores a value under a key. */
    setItem(key: string, value: string): void;
}
