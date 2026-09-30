// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownTextEdit } from './MarkdownTextEdit';

/**
 * Replaces the text between two positions, leaving the caret right after what was put in.
 * An empty range (`start === end`) is a plain insert at the caret.
 * @param value The markdown being edited.
 * @param start Where the replaced range starts.
 * @param end Where the replaced range ends.
 * @param text The text to put in its place.
 * @returns The edited markdown and the caret position after it.
 */
export const replaceRange = (value: string, start: number, end: number, text: string): MarkdownTextEdit => {
    const caret = start + text.length;
    return {
        value: `${value.slice(0, start)}${text}${value.slice(end)}`,
        selectionStart: caret,
        selectionEnd: caret,
    };
};
