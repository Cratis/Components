// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * What a {@link MarkdownEditor} is showing. Only one pane is on screen at a time: the markdown being
 * written, or the rendered preview of it.
 */
export enum MarkdownEditorMode {
    /** The raw markdown, with the formatting toolbar. */
    Write = 'write',

    /** The markdown rendered by the host's preview renderer. */
    Preview = 'preview',
}
