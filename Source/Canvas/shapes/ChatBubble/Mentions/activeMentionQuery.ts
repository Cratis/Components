// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MentionQuery } from './MentionQuery';

/**
 * How many characters may follow the `@` before we stop treating it as a mention being typed. Names
 * can contain spaces, so without a ceiling an unfinished `@` would keep the list open over a whole
 * paragraph.
 */
const MAX_QUERY_LENGTH = 30;

/**
 * Finds the mention being typed at the caret, if any.
 * @param text The full text of the input.
 * @param caret The caret position within it.
 * @returns The mention being typed, or null when the caret is not inside one.
 */
export const activeMentionQuery = (text: string, caret: number): MentionQuery | null => {
    const before = text.slice(0, caret);
    const start = before.lastIndexOf('@');
    if (start < 0) {
        return null;
    }

    // A mention starts a word — "name@example.com" is an address, not a mention of "example.com".
    const preceding = start === 0 ? '' : before[start - 1];
    if (preceding !== '' && !/\s/.test(preceding)) {
        return null;
    }

    const query = before.slice(start + 1);
    if (query.length > MAX_QUERY_LENGTH || query.includes('\n')) {
        return null;
    }

    return { start, text: query };
};
