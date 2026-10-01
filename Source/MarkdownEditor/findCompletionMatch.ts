// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownCompletion } from './MarkdownCompletion';
import type { MarkdownCompletionMatch } from './MarkdownCompletionMatch';

interface TriggerMatch {
    start: number;
    query: string;
}

const whitespace = /\s/u;

const matchStringTrigger = (line: string, completion: MarkdownCompletion, trigger: string): TriggerMatch | undefined => {
    const triggerIndex = line.lastIndexOf(trigger);
    if (triggerIndex === -1) return undefined;
    if (triggerIndex > 0 && !whitespace.test(line[triggerIndex - 1])) return undefined;

    const typed = line.slice(triggerIndex + trigger.length);
    if (!completion.allowSpaces && whitespace.test(typed)) return undefined;

    return { start: triggerIndex, query: completion.allowSpaces ? typed.trimStart() : typed };
};

const matchPatternTrigger = (line: string, trigger: RegExp): TriggerMatch | undefined => {
    const pattern = new RegExp(trigger.source, trigger.flags.replace(/[gy]/gu, ''));
    const match = pattern.exec(line);
    if (!match || match.index + match[0].length !== line.length) return undefined;
    return { start: match.index, query: match.groups?.query ?? match[1] ?? match[0] };
};

/**
 * Finds the completion being typed at the caret. When several triggers match, the one that starts
 * closest to the caret wins, because that is the one being typed.
 * @param value The markdown being edited.
 * @param caret The caret position.
 * @param completions The configured completions.
 * @returns The match, or undefined when the caret is not completing anything.
 */
export const findCompletionMatch = (
    value: string,
    caret: number,
    completions: readonly MarkdownCompletion[],
): MarkdownCompletionMatch | undefined => {
    const beforeCaret = value.slice(0, caret);
    const lineStart = beforeCaret.lastIndexOf('\n') + 1;
    const line = beforeCaret.slice(lineStart);
    let best: MarkdownCompletionMatch | undefined;

    completions.forEach((completion, completionIndex) => {
        const found =
            typeof completion.trigger === 'string'
                ? completion.trigger.length > 0
                    ? matchStringTrigger(line, completion, completion.trigger)
                    : undefined
                : matchPatternTrigger(line, completion.trigger);
        if (!found || found.query.length < (completion.minimumQueryLength ?? 0)) return;

        const start = lineStart + found.start;
        if (!best || start > best.start) {
            best = { completion, completionIndex, start, end: caret, query: found.query };
        }
    });

    return best;
};
