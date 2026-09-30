// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A formatting action offered by the {@link MarkdownEditor}'s toolbar. Each one edits the markdown
 * around the current selection, and applying it to text that already carries it takes it off again.
 */
export enum MarkdownFormat {
    /** Wraps the selection in `**`. */
    Bold = 'bold',

    /** Wraps the selection in `_`. */
    Italic = 'italic',

    /** Wraps the selection in `~~`. */
    Strikethrough = 'strikethrough',

    /** Prefixes the selected lines with `## `. */
    Heading = 'heading',

    /** Prefixes the selected lines with `> `. */
    Quote = 'quote',

    /** Wraps the selection in backticks. */
    Code = 'code',

    /** Fences the selected lines in a code block. */
    CodeBlock = 'codeBlock',

    /** Turns the selection into a link and selects the address to type over. */
    Link = 'link',

    /** Prefixes the selected lines with `- `. */
    BulletList = 'bulletList',

    /** Numbers the selected lines `1. `, `2. `, … */
    NumberedList = 'numberedList',

    /** Prefixes the selected lines with `- [ ] `. */
    TaskList = 'taskList',
}
