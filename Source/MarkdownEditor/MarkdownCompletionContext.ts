// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * What a {@link MarkdownCompletion} is told alongside the query when it is asked for suggestions.
 */
export interface MarkdownCompletionContext {
    /**
     * Aborted as soon as the answer is no longer wanted - the person typed on, moved the caret away or
     * picked something. Pass it to `fetch` or check it before doing more work.
     */
    signal: AbortSignal;
}
