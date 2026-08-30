// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { findMentionRanges } from './findMentionRanges';

/**
 * One run of a message body — plain text, or a mention of somebody.
 * @typeParam TCandidate Whatever describes who can be mentioned — anything with a name.
 */
export interface MentionSegment<TCandidate extends { name: string }> {
    /** The text of the run, including the `@` when it is a mention. */
    text: string;

    /** Who the run mentions — unset for plain text. */
    mention?: TCandidate;
}

/**
 * Splits a message body into runs of plain text and mentions, so mentions can render distinctly
 * while the body itself stays plain readable text.
 * @param text The body to split.
 * @param candidates Who the body is known to mention.
 * @returns The runs, in order. A body without mentions comes back as one plain run.
 */
export const mentionSegments = <TCandidate extends { name: string }>(
    text: string,
    candidates: TCandidate[],
): MentionSegment<TCandidate>[] => {
    const segments: MentionSegment<TCandidate>[] = [];
    let position = 0;

    for (const range of findMentionRanges(text, candidates)) {
        if (range.start > position) {
            segments.push({ text: text.slice(position, range.start) });
        }
        segments.push({
            text: text.slice(range.start, range.end),
            mention: range.candidate,
        });
        position = range.end;
    }

    if (position < text.length || segments.length === 0) {
        segments.push({ text: text.slice(position) });
    }

    return segments;
};
