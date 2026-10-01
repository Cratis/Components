// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownTextEdit } from './MarkdownTextEdit';

/**
 * Wraps the selection in an inline marker such as `**` or a backtick, or takes the marker off when
 * the selection already carries it - either just outside the selection or as its first and last
 * characters. The selection stays on the same text, so a second format can be applied straight after.
 * @param value The markdown being edited.
 * @param start Where the selection starts.
 * @param end Where the selection ends.
 * @param marker The marker to toggle.
 * @returns The edited markdown and the selection after it.
 */
export const toggleInlineMarker = (value: string, start: number, end: number, marker: string): MarkdownTextEdit => {
    const length = marker.length;
    const selected = value.slice(start, end);

    const markedOutside =
        value.slice(start - length, start) === marker && value.slice(end, end + length) === marker;
    if (markedOutside) {
        return {
            value: `${value.slice(0, start - length)}${selected}${value.slice(end + length)}`,
            selectionStart: start - length,
            selectionEnd: end - length,
        };
    }

    const markedInside =
        selected.length >= length * 2 && selected.startsWith(marker) && selected.endsWith(marker);
    if (markedInside) {
        const inner = selected.slice(length, selected.length - length);
        return {
            value: `${value.slice(0, start)}${inner}${value.slice(end)}`,
            selectionStart: start,
            selectionEnd: start + inner.length,
        };
    }

    return {
        value: `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`,
        selectionStart: start + length,
        selectionEnd: end + length,
    };
};
