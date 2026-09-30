// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, TextareaHTMLAttributes } from 'react';

/** Attributes passed through to one part of a {@link MarkdownEditor}, including `data-*` attributes. */
export type MarkdownEditorPartAttributes<TElement> = HTMLAttributes<TElement> & {
    [attribute: `data-${string}`]: string | number | boolean | undefined;
};

/**
 * Stable Cratis-owned parts for styling a {@link MarkdownEditor}. Each is marked with a matching
 * `data-cratis-part` attribute, and what is passed here is spread onto that element - the editor's own
 * value, selection and event wiring always win.
 */
export interface MarkdownEditorParts {
    /** The editor's single bordered box. Carries `data-disabled`, `data-invalid`, `data-readonly` and `data-busy`. */
    root?: MarkdownEditorPartAttributes<HTMLDivElement>;

    /** The formatting toolbar. */
    toolbar?: MarkdownEditorPartAttributes<HTMLDivElement>;

    /** Every formatting button in the toolbar. Carries `data-disabled`. */
    format?: MarkdownEditorPartAttributes<HTMLButtonElement>;

    /** The round button that swaps between the markdown and the preview. Carries `data-pressed`. */
    toggle?: MarkdownEditorPartAttributes<HTMLButtonElement>;

    /** The writing area. Carries `data-disabled`, `data-invalid` and `data-readonly`. */
    textarea?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue' | 'onChange'> & {
        [attribute: `data-${string}`]: string | number | boolean | undefined;
    };

    /** The rendered preview pane. */
    preview?: MarkdownEditorPartAttributes<HTMLDivElement>;

    /** The status line announcing uploads in progress. */
    status?: MarkdownEditorPartAttributes<HTMLDivElement>;

    /** The suggestion list that opens at the caret while a completion is typed. */
    suggestions?: MarkdownEditorPartAttributes<HTMLDivElement>;

    /** Every entry in the suggestion list. Carries `data-selected` on the highlighted one. */
    suggestion?: MarkdownEditorPartAttributes<HTMLDivElement>;
}
