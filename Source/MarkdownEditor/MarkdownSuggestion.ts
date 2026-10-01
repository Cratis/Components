// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * One entry in the list a {@link MarkdownCompletion} offers while its trigger is being typed. The host
 * maps whatever it looks up - an issue, a person, a document - into this shape; the editor renders it
 * and writes {@link insertText} into the markdown when it is picked.
 */
export interface MarkdownSuggestion {
    /** Identifies the suggestion within one list. Used as its key and in its element id. */
    id: string;

    /** The text that replaces the trigger and everything typed after it when the suggestion is picked. */
    insertText: string;

    /** The main text of the entry, such as a title or a name. */
    label: string;

    /** Secondary text shown ahead of the label in a monospace face, such as `owner/repository#12`. */
    detail?: string;

    /** A short annotation shown after the label, such as the kind of thing suggested. */
    annotation?: string;
}
