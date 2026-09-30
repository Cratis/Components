// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownLineBlock } from './MarkdownLineBlock';

/**
 * Finds the whole lines a selection touches. A selection that ends right at the start of a line -
 * what selecting whole lines with the keyboard produces - does not count that line as touched.
 * @param value The markdown being edited.
 * @param start Where the selection starts.
 * @param end Where the selection ends.
 * @returns The touched lines and where they sit in the markdown.
 */
export const lineBlockAround = (value: string, start: number, end: number): MarkdownLineBlock => {
    const effectiveEnd = end > start && value[end - 1] === '\n' ? end - 1 : end;
    const blockStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineBreakAfter = value.indexOf('\n', effectiveEnd);
    const blockEnd = lineBreakAfter === -1 ? value.length : lineBreakAfter;
    return {
        start: blockStart,
        end: blockEnd,
        lines: value.slice(blockStart, blockEnd).split('\n'),
    };
};
