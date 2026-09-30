// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { MarkdownFormat } from './MarkdownFormat';
import type { MarkdownTextEdit } from './MarkdownTextEdit';
import { insertLink } from './insertLink';
import { toggleCodeBlock } from './toggleCodeBlock';
import { toggleInlineMarker } from './toggleInlineMarker';
import { toggleLinePrefix } from './toggleLinePrefix';

const heading = /^#{1,6} /u;
const quote = /^> ?/u;
const bullet = /^[-*+] (?!\[[ xX]\] )/u;
const numbered = /^\d+\. /u;
const task = /^[-*+] \[[ xX]\] /u;

/**
 * Applies a toolbar format to the selection in a piece of markdown. Every format is a toggle: applying
 * it where it is already applied takes it off.
 * @param value The markdown being edited.
 * @param selectionStart Where the selection starts.
 * @param selectionEnd Where the selection ends.
 * @param format The {@link MarkdownFormat} to apply.
 * @returns The edited markdown and the selection the writing area should show afterwards.
 */
export const applyMarkdownFormat = (
    value: string,
    selectionStart: number,
    selectionEnd: number,
    format: MarkdownFormat,
): MarkdownTextEdit => {
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);

    switch (format) {
        case MarkdownFormat.Bold:
            return toggleInlineMarker(value, start, end, '**');
        case MarkdownFormat.Italic:
            return toggleInlineMarker(value, start, end, '_');
        case MarkdownFormat.Strikethrough:
            return toggleInlineMarker(value, start, end, '~~');
        case MarkdownFormat.Code:
            return toggleInlineMarker(value, start, end, '`');
        case MarkdownFormat.CodeBlock:
            return toggleCodeBlock(value, start, end);
        case MarkdownFormat.Link:
            return insertLink(value, start, end);
        case MarkdownFormat.Heading:
            return toggleLinePrefix(value, start, end, () => '## ', heading);
        case MarkdownFormat.Quote:
            return toggleLinePrefix(value, start, end, () => '> ', quote);
        case MarkdownFormat.BulletList:
            return toggleLinePrefix(value, start, end, () => '- ', bullet);
        case MarkdownFormat.NumberedList:
            return toggleLinePrefix(value, start, end, lineIndex => `${lineIndex + 1}. `, numbered);
        case MarkdownFormat.TaskList:
            return toggleLinePrefix(value, start, end, () => '- [ ] ', task);
    }
};
