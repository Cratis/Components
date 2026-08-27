// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MentionQuery } from './MentionQuery';

/**
 * The text after a mention has been inserted, and where the caret ends up.
 */
export interface MentionApplied {

    /** The new text of the input. */
    text: string;

    /** Where the caret should sit afterwards. */
    caret: number;
}

/**
 * Replaces the mention being typed with the chosen name.
 * @param text The full text of the input.
 * @param caret The caret position within it.
 * @param query The mention being typed, as found by activeMentionQuery.
 * @param name The name that was chosen.
 * @returns The text to show and where to put the caret.
 */
export const applyMention = (text: string, caret: number, query: MentionQuery, name: string): MentionApplied => {
    // A trailing space both separates the mention from what is typed next and closes the mention, so
    // the candidate list does not immediately reopen on the name that was just chosen.
    const mention = `@${name} `;
    const after = text.slice(caret);

    return {
        text: `${text.slice(0, query.start)}${mention}${after}`,
        caret: query.start + mention.length,
    };
};
