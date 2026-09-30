// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Where the caret of a writing area is on screen, in viewport coordinates.
 */
export interface CaretPosition {
    /** The left edge of the caret. */
    left: number;

    /** The top of the line the caret is on. */
    top: number;

    /** The bottom of the line the caret is on. */
    bottom: number;
}
