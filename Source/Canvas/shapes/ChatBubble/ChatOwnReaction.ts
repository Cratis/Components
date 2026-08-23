// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Guid } from '@cratis/fundamentals';

/**
 * The reaction a specific person gave to a message, found by {@link findOwnReaction}. Carries the
 * reaction's identifier so a caller can reuse it to change the emoji, or target it to take the
 * reaction back.
 */
export interface ChatOwnReaction {

    /** The identifier of the reaction record. */
    reactionId: Guid;

    /** The emoji they gave. */
    emoji: string;
}
