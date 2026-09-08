// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The mention being typed at the caret.
 */
export interface MentionQuery {

    /** The index of the `@` that opened the mention. */
    start: number;

    /** What has been typed after the `@`, which the candidate list is filtered by. */
    text: string;
}
