// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { MarkdownCompletionContext } from './MarkdownCompletionContext';
import type { MarkdownSuggestion } from './MarkdownSuggestion';

/**
 * Configures autocompletion for a {@link MarkdownEditor}: what starts it, and where the suggestions
 * come from. The editor recognizes the trigger at the caret, asks {@link suggest} for suggestions,
 * renders the list, and writes the picked suggestion's text over the trigger and what followed it.
 *
 * ```ts
 * const issues: MarkdownCompletion = {
 *     trigger: '#',
 *     allowSpaces: true,
 *     label: 'Issues',
 *     suggest: async (query, { signal }) => (await searchIssues(query, signal)).map(issue => ({
 *         id: issue.id,
 *         insertText: `#${issue.number}`,
 *         label: issue.title,
 *         detail: `#${issue.number}`,
 *     })),
 * };
 * ```
 */
export interface MarkdownCompletion {
    /**
     * What starts a completion.
     *
     * A string, such as `'#'` or `'@'`, starts one when it is typed at the start of a line or after
     * whitespace; what follows it up to the caret, on the same line, is the query.
     *
     * A regular expression is matched against the current line up to the caret and starts a completion
     * when its match ends at the caret. The whole match is what a picked suggestion replaces, and the
     * query is the named group `query` when there is one, otherwise the first group, otherwise the
     * whole match. Anchor it with `$` and use a lookbehind such as `(?<=^|\s)` for word boundaries.
     */
    trigger: string | RegExp;

    /**
     * Whether the query of a string trigger may contain spaces - searching by title rather than by a
     * single word. Leading spaces are dropped from the query. Defaults to `false`.
     */
    allowSpaces?: boolean;

    /** How many characters must follow the trigger before suggestions are asked for. Defaults to `0`. */
    minimumQueryLength?: number;

    /** How long typing must pause, in milliseconds, before suggestions are asked for. Defaults to `150`. */
    debounce?: number;

    /**
     * Returns the suggestions for what has been typed after the trigger. May answer synchronously or
     * with a promise; an answer for a query the person has already typed past is dropped, and so is a
     * rejected one. An empty answer closes the list.
     * @param query What has been typed after the trigger.
     * @param context The {@link MarkdownCompletionContext} of the request.
     * @returns The suggestions to offer, in the order to offer them.
     */
    suggest: (
        query: string,
        context: MarkdownCompletionContext,
    ) => readonly MarkdownSuggestion[] | Promise<readonly MarkdownSuggestion[]>;

    /** Accessible name of the suggestion list. Defaults to the editor's `suggestions` label. */
    label?: string;

    /**
     * Renders the content of one suggestion in place of the default detail, label and annotation.
     * @param suggestion The suggestion to render.
     * @returns What to show for it.
     */
    renderSuggestion?: (suggestion: MarkdownSuggestion) => ReactNode;
}
