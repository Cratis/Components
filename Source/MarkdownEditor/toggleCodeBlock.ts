// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownTextEdit } from './MarkdownTextEdit';
import { lineBlockAround } from './lineBlockAround';

const fence = '```';

/**
 * Fences the lines the selection touches in a code block, or takes the fences off when those lines
 * already open and close one.
 * @param value The markdown being edited.
 * @param start Where the selection starts.
 * @param end Where the selection ends.
 * @returns The edited markdown and the selection after it.
 */
export const toggleCodeBlock = (value: string, start: number, end: number): MarkdownTextEdit => {
    const block = lineBlockAround(value, start, end);
    const before = value.slice(0, block.start);
    const after = value.slice(block.end);
    const lines = block.lines;
    const fenced = lines.length >= 2 && lines[0].startsWith(fence) && lines[lines.length - 1].trim() === fence;

    if (fenced) {
        const inner = lines.slice(1, -1).join('\n');
        return {
            value: `${before}${inner}${after}`,
            selectionStart: block.start,
            selectionEnd: block.start + inner.length,
        };
    }

    const inner = lines.join('\n');
    const opening = `${fence}\n`;
    const contentStart = block.start + opening.length;
    const caretOffset = start === end ? start - block.start : 0;
    return {
        value: `${before}${opening}${inner}\n${fence}${after}`,
        selectionStart: contentStart + caretOffset,
        selectionEnd: start === end ? contentStart + caretOffset : contentStart + inner.length,
    };
};
