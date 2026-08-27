// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Where in a text a mention of a known candidate sits.
 * @typeParam TCandidate Whatever describes who can be mentioned — anything with a name.
 */
export interface MentionRange<TCandidate extends { name: string }> {

    /** The index of the `@` that opens the mention. */
    start: number;

    /** The index just past the last character of the mentioned name. */
    end: number;

    /** Who is mentioned. */
    candidate: TCandidate;
}

/** Whether the character closes a mention — anything that is not a letter or digit does. */
const closesMention = (character: string | undefined): boolean =>
    character === undefined || !/[a-z0-9]/i.test(character);

/** Whether the character before the `@` lets it open a mention — a mention starts a word. */
const opensMention = (character: string | undefined): boolean =>
    character === undefined || /\s/.test(character);

/**
 * Finds where a text mentions any of the given candidates, written as plain `@Name`. Matching is
 * case-insensitive; a longer name wins where names overlap (`@Alice Johnson` is one mention of
 * Alice Johnson, not a mention of Alice followed by text); and a name that merely continues into
 * a longer word (`@Alison` when the candidate is Ali) is not a mention.
 * @param text The text to search.
 * @param candidates Everyone who could be mentioned.
 * @returns The ranges found, in the order they appear in the text.
 */
export const findMentionRanges = <TCandidate extends { name: string }>(text: string, candidates: TCandidate[]): MentionRange<TCandidate>[] => {
    const ranges: MentionRange<TCandidate>[] = [];
    const lowered = text.toLowerCase();
    const byLongestName = [...candidates]
        .filter(candidate => candidate.name.trim().length > 0)
        .sort((left, right) => right.name.length - left.name.length);

    const overlapsExisting = (start: number, end: number) =>
        ranges.some(range => start < range.end && end > range.start);

    for (const candidate of byLongestName) {
        const token = `@${candidate.name.toLowerCase()}`;
        let index = lowered.indexOf(token);
        while (index >= 0) {
            const end = index + token.length;
            if (opensMention(index === 0 ? undefined : text[index - 1]) &&
                closesMention(text[end]) &&
                !overlapsExisting(index, end)) {
                ranges.push({ start: index, end, candidate });
            }
            index = lowered.indexOf(token, index + 1);
        }
    }

    return ranges.sort((left, right) => left.start - right.start);
};
