// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownTextEdit } from './MarkdownTextEdit';

const addressPlaceholder = 'url';
const textPlaceholder = 'text';
const looksLikeAnAddress = /^(https?:\/\/|mailto:)\S+$/iu;

/**
 * Turns the selection into a markdown link and selects the part still to be written: the address when
 * text was selected, the link text when an address was selected, and the link text of an empty link
 * when nothing was.
 * @param value The markdown being edited.
 * @param start Where the selection starts.
 * @param end Where the selection ends.
 * @returns The edited markdown and the selection after it.
 */
export const insertLink = (value: string, start: number, end: number): MarkdownTextEdit => {
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (looksLikeAnAddress.test(selected)) {
        return {
            value: `${before}[${textPlaceholder}](${selected})${after}`,
            selectionStart: start + 1,
            selectionEnd: start + 1 + textPlaceholder.length,
        };
    }

    const text = selected.length > 0 ? selected : textPlaceholder;
    const link = `[${text}](${addressPlaceholder})`;
    const addressStart = start + text.length + 3;
    return {
        value: `${before}${link}${after}`,
        selectionStart: selected.length > 0 ? addressStart : start + 1,
        selectionEnd: selected.length > 0 ? addressStart + addressPlaceholder.length : start + 1 + text.length,
    };
};
