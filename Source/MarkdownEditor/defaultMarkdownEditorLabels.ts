// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MarkdownEditorLabels } from './MarkdownEditorLabels';

/** The English labels a {@link MarkdownEditor} falls back to for every label the host leaves unset. */
export const defaultMarkdownEditorLabels: Required<MarkdownEditorLabels> = {
    editor: 'Markdown',
    toolbar: 'Formatting',
    bold: 'Bold',
    italic: 'Italic',
    strikethrough: 'Strikethrough',
    heading: 'Heading',
    quote: 'Quote',
    code: 'Code',
    codeBlock: 'Code block',
    link: 'Link',
    bulletList: 'Bulleted list',
    numberedList: 'Numbered list',
    taskList: 'Task list',
    showPreview: 'Show preview',
    showMarkdown: 'Show markdown',
    emptyPreview: 'Nothing to preview',
    suggestions: 'Suggestions',
    uploading: fileNames => `Uploading ${fileNames.join(', ')}…`,
};
