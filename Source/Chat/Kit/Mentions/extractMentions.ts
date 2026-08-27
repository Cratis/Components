// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { findMentionRanges } from './findMentionRanges';

/**
 * The candidates a text actually mentions, each once, in the order they first appear. Used when a
 * message is sent: the composer knows who *could* be mentioned, and this reduces that to who the
 * final text really addresses — a mention that was picked but edited away again does not count.
 * @param text The text to search.
 * @param candidates Everyone who could be mentioned.
 * @returns The mentioned candidates, deduplicated, in order of first appearance.
 */
export const extractMentions = <TCandidate extends { name: string }>(
    text: string,
    candidates: TCandidate[],
): TCandidate[] => {
    const mentioned: TCandidate[] = [];
    for (const range of findMentionRanges(text, candidates)) {
        if (!mentioned.includes(range.candidate)) {
            mentioned.push(range.candidate);
        }
    }
    return mentioned;
};
