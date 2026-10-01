// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ClipboardEvent, DragEvent, KeyboardEvent, RefObject, SyntheticEvent } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { MarkdownEditorLabels } from './MarkdownEditorLabels';
import type { MarkdownEditorParts } from './MarkdownEditorParts';
import type { MarkdownEditorProps } from './MarkdownEditor';
import type { MarkdownFormat } from './MarkdownFormat';
import type { MarkdownTextEdit } from './MarkdownTextEdit';
import { filesIn } from './filesIn';
import { formatShortcuts } from './formatShortcuts';
import type { MarkdownCompletionState } from './useMarkdownCompletion';
import type { MarkdownUploadsState } from './useMarkdownUploads';

/** Props for {@link MarkdownWritingArea}. */
export interface MarkdownWritingAreaProps
    extends Pick<
        MarkdownEditorProps,
        | 'value'
        | 'onChange'
        | 'onBlur'
        | 'placeholder'
        | 'autoFocus'
        | 'disabled'
        | 'readOnly'
        | 'invalid'
        | 'id'
        | 'aria-label'
        | 'aria-labelledby'
        | 'aria-describedby'
    > {
    /** Pass-through attributes for the textarea. */
    parts?: MarkdownEditorParts['textarea'];

    /** The writing area's element, which the editor formats and measures. */
    textareaRef: RefObject<HTMLTextAreaElement | null>;

    /** The resolved labels. */
    labels: Required<MarkdownEditorLabels>;

    /** The completion being typed at the caret. */
    completion: MarkdownCompletionState;

    /** The uploads started from this editor. */
    uploads: MarkdownUploadsState;

    /** The element id of the suggestion list. */
    suggestionsId: string;

    /** The element id of the highlighted suggestion, while the list is open. */
    activeOptionId?: string;

    /** Called when the selection moves. */
    onSelectionChange: (start: number, end: number) => void;

    /** Applies an edit that also places the selection. */
    onEdit: (edit: MarkdownTextEdit) => void;

    /** Applies a format to the selection, as a keyboard shortcut asks. */
    onFormat: (format: MarkdownFormat) => void;
}

const hasFiles = (event: DragEvent<HTMLTextAreaElement>) => Array.from(event.dataTransfer.types).includes('Files');

/**
 * The textarea of a {@link MarkdownEditor}, with its completion keys, formatting shortcuts, and file
 * paste and drop.
 */
export const MarkdownWritingArea = (props: MarkdownWritingAreaProps) => {
    const { completion, uploads, textareaRef, parts } = props;
    const disabled = props.disabled ?? false;
    const readOnly = props.readOnly ?? false;
    const invalid = props.invalid ?? false;

    const reportSelection = (event: SyntheticEvent<HTMLTextAreaElement>) =>
        props.onSelectionChange(event.currentTarget.selectionStart, event.currentTarget.selectionEnd);

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        parts?.onKeyDown?.(event);
        const edit = completion.handleKeyDown(event);
        if (edit) {
            props.onEdit(edit);
            return;
        }
        if (event.defaultPrevented || event.altKey || event.shiftKey || !(event.ctrlKey || event.metaKey)) return;
        const format = formatShortcuts.get(event.key.toLowerCase());
        if (!format || disabled || readOnly) return;
        event.preventDefault();
        props.onFormat(format);
    };

    const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        parts?.onPaste?.(event);
        if (!uploads.isEnabled) return;
        const files = filesIn(event.clipboardData.items);
        if (files.length === 0) return;
        event.preventDefault();
        uploads.upload(files);
    };

    const onDrop = (event: DragEvent<HTMLTextAreaElement>) => {
        parts?.onDrop?.(event);
        if (!uploads.isEnabled) return;
        const files = Array.from(event.dataTransfer.files);
        if (files.length === 0) return;
        event.preventDefault();
        uploads.upload(files);
    };

    return (
        <textarea
            {...parts}
            ref={textareaRef}
            id={props.id}
            className={classNames('cratis-markdown-editor__textarea', parts?.className)}
            data-cratis-part='textarea'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            value={props.value}
            placeholder={props.placeholder}
            disabled={disabled}
            readOnly={readOnly}
            autoFocus={props.autoFocus}
            spellCheck
            aria-label={props['aria-labelledby'] ? props['aria-label'] : (props['aria-label'] ?? props.labels.editor)}
            aria-labelledby={props['aria-labelledby']}
            aria-describedby={props['aria-describedby']}
            aria-invalid={invalid || undefined}
            aria-multiline='true'
            aria-autocomplete={completion.isOpen ? 'list' : undefined}
            aria-controls={completion.isOpen ? props.suggestionsId : undefined}
            aria-activedescendant={props.activeOptionId}
            onChange={event => {
                props.onSelectionChange(event.target.selectionStart, event.target.selectionEnd);
                props.onChange(event.target.value);
            }}
            onSelect={event => {
                parts?.onSelect?.(event);
                reportSelection(event);
            }}
            onKeyDown={onKeyDown}
            onBlur={event => {
                parts?.onBlur?.(event);
                props.onBlur?.();
            }}
            onPaste={onPaste}
            onDrop={onDrop}
            onDragOver={event => {
                parts?.onDragOver?.(event);
                if (uploads.isEnabled && hasFiles(event)) event.preventDefault();
            }}
        />
    );
};
