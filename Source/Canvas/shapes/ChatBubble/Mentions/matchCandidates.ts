// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MentionCandidate } from './MentionCandidate';

/** How many candidates the list shows at once, so it never covers the conversation. */
const MAX_SUGGESTIONS = 6;

/**
 * Narrows the people and agents that can be mentioned down to those matching what has been typed.
 * @param candidates Everyone who could be mentioned.
 * @param query What has been typed after the `@`.
 * @returns The matching candidates, those whose name starts with the query first.
 */
export const matchCandidates = (candidates: MentionCandidate[], query: string): MentionCandidate[] => {
    const needle = query.trim().toLowerCase();
    const matching = needle.length === 0
        ? candidates
        : candidates.filter(candidate => candidate.name.toLowerCase().includes(needle));

    // A name that starts with what was typed is almost always the one being reached for, so it comes
    // first; everything else keeps the order it was given in.
    const startsWith = matching.filter(candidate => candidate.name.toLowerCase().startsWith(needle));
    const contains = matching.filter(candidate => !candidate.name.toLowerCase().startsWith(needle));

    return [...startsWith, ...contains].slice(0, MAX_SUGGESTIONS);
};
