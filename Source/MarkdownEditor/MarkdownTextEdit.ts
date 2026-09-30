// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Markdown after an edit, together with the selection the writing area should show afterwards.
 */
export interface MarkdownTextEdit {
    /** The markdown after the edit. */
    value: string;

    /** Where the selection starts after the edit. */
    selectionStart: number;

    /** Where the selection ends after the edit. Equal to {@link selectionStart} for a plain caret. */
    selectionEnd: number;
}
