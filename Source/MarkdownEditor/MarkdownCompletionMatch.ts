// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownCompletion } from './MarkdownCompletion';

/**
 * A completion trigger found at the caret, and the query typed after it.
 */
export interface MarkdownCompletionMatch {
    /** The completion whose trigger was found. */
    completion: MarkdownCompletion;

    /** The position of the matched completion in the list it was configured in. */
    completionIndex: number;

    /** Where the trigger starts - the start of what a picked suggestion replaces. */
    start: number;

    /** The caret - the end of what a picked suggestion replaces. */
    end: number;

    /** What has been typed after the trigger. */
    query: string;
}
