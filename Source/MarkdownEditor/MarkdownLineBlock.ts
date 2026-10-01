// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The whole lines a selection touches - the unit that line formats such as lists and quotes apply to.
 */
export interface MarkdownLineBlock {
    /** Where the first touched line starts. */
    start: number;

    /** Where the last touched line ends, before its line break. */
    end: number;

    /** The touched lines, without their line breaks. */
    lines: string[];
}
