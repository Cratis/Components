// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownTextEdit } from './MarkdownTextEdit';
import { lineBlockAround } from './lineBlockAround';

/**
 * Puts a prefix such as `> ` or `- ` in front of every line the selection touches, or takes it off
 * when every one of those lines already has it. A caret keeps its place in the text; a selection grows
 * to cover the edited lines.
 * @param value The markdown being edited.
 * @param start Where the selection starts.
 * @param end Where the selection ends.
 * @param prefixFor Gives the prefix for the line at a position within the touched lines.
 * @param existing Recognizes a line that already carries the prefix, and matches the prefix itself.
 * @returns The edited markdown and the selection after it.
 */
export const toggleLinePrefix = (
    value: string,
    start: number,
    end: number,
    prefixFor: (lineIndex: number) => string,
    existing: RegExp,
): MarkdownTextEdit => {
    const block = lineBlockAround(value, start, end);
    const everyLinePrefixed = block.lines.every(line => existing.test(line));
    const edited = everyLinePrefixed
        ? block.lines.map(line => line.replace(existing, ''))
        : block.lines.map((line, lineIndex) => `${prefixFor(lineIndex)}${line}`);
    const editedBlock = edited.join('\n');
    const result = `${value.slice(0, block.start)}${editedBlock}${value.slice(block.end)}`;

    if (start === end) {
        const shift = edited[0].length - block.lines[0].length;
        const caret = Math.max(block.start, start + shift);
        return { value: result, selectionStart: caret, selectionEnd: caret };
    }

    return {
        value: result,
        selectionStart: block.start,
        selectionEnd: block.start + editedBlock.length,
    };
};
