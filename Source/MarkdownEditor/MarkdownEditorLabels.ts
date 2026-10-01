// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Overrides for every label a {@link MarkdownEditor} renders or announces. Any field left unset falls
 * back to a literal English default, so a host with its own translations passes them here.
 */
export interface MarkdownEditorLabels {
    /** Accessible name of the writing area when the host gives it none. Defaults to `'Markdown'`. */
    editor?: string;

    /** Accessible name of the formatting toolbar. Defaults to `'Formatting'`. */
    toolbar?: string;

    /** The bold format. Defaults to `'Bold'`. */
    bold?: string;

    /** The italic format. Defaults to `'Italic'`. */
    italic?: string;

    /** The strikethrough format. Defaults to `'Strikethrough'`. */
    strikethrough?: string;

    /** The heading format. Defaults to `'Heading'`. */
    heading?: string;

    /** The quote format. Defaults to `'Quote'`. */
    quote?: string;

    /** The inline code format. Defaults to `'Code'`. */
    code?: string;

    /** The code block format. Defaults to `'Code block'`. */
    codeBlock?: string;

    /** The link format. Defaults to `'Link'`. */
    link?: string;

    /** The bulleted list format. Defaults to `'Bulleted list'`. */
    bulletList?: string;

    /** The numbered list format. Defaults to `'Numbered list'`. */
    numberedList?: string;

    /** The task list format. Defaults to `'Task list'`. */
    taskList?: string;

    /** What the mode toggle says while the markdown is showing. Defaults to `'Show preview'`. */
    showPreview?: string;

    /** What the mode toggle says while the preview is showing. Defaults to `'Show markdown'`. */
    showMarkdown?: string;

    /** Shown in the preview when there is no markdown. Defaults to `'Nothing to preview'`. */
    emptyPreview?: string;

    /** Accessible name of a suggestion list whose completion names none. Defaults to `'Suggestions'`. */
    suggestions?: string;

    /**
     * Announces the files uploading. Defaults to `Uploading <names>…`.
     * @param fileNames The names of the files uploading, in the order they were added.
     * @returns The text to show.
     */
    uploading?: (fileNames: readonly string[]) => string;
}
