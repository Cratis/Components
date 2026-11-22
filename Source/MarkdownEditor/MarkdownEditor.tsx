// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { classNames } from '../ClassNames/classNames';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import type { CaretPosition } from './CaretPosition';
import type { MarkdownCompletion } from './MarkdownCompletion';
import type { MarkdownEditorLabels } from './MarkdownEditorLabels';
import { MarkdownEditorMode } from './MarkdownEditorMode';
import type { MarkdownEditorParts } from './MarkdownEditorParts';
import type { MarkdownFormat } from './MarkdownFormat';
import type { MarkdownSuggestion } from './MarkdownSuggestion';
import type { MarkdownTextEdit } from './MarkdownTextEdit';
import { MarkdownModeToggle } from './MarkdownModeToggle';
import { MarkdownSuggestionList } from './MarkdownSuggestionList';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownWritingArea } from './MarkdownWritingArea';
import { applyMarkdownFormat } from './applyMarkdownFormat';
import { caretPositionIn } from './caretPositionIn';
import { defaultMarkdownEditorLabels } from './defaultMarkdownEditorLabels';
import { defaultMarkdownFormats } from './defaultMarkdownFormats';
import { useMarkdownCompletion } from './useMarkdownCompletion';
import { useMarkdownUploads } from './useMarkdownUploads';

const markdownEditorPartsMatchManifest: ExactPartKeys<MarkdownEditorParts, PartsOf<'MarkdownEditor'>> = true;
void markdownEditorPartsMatchManifest;

/** The height the editor falls back to when its container leaves its height to its content. */
const defaultHeight = 320;

/** Props for {@link MarkdownEditor}. */
export interface MarkdownEditorProps {
    /** The markdown being edited. */
    value: string;

    /** Called with the markdown as it is written, formatted, completed or uploaded into. */
    onChange: (value: string) => void;

    /** Called when focus leaves the writing area. */
    onBlur?: () => void;

    /** Placeholder shown while the markdown is empty. */
    placeholder?: string;

    /**
     * The height the editor takes when its container leaves its height to its content - a number of
     * pixels or any CSS length. Inside a container with a height of its own the editor fills that
     * instead. Defaults to 320 pixels.
     */
    height?: number | string;

    /** The mode the editor opens in. Defaults to {@link MarkdownEditorMode.Write}. */
    initialMode?: MarkdownEditorMode;

    /** Focuses the writing area as the editor mounts. */
    autoFocus?: boolean;

    /** Disables writing, formatting and uploading. */
    disabled?: boolean;

    /** Shows the markdown without letting it be changed. */
    readOnly?: boolean;

    /** Marks the markdown as invalid, as a failed validation does. */
    invalid?: boolean;

    /**
     * The formatting toolbar, as groups of formats separated from each other. Pass `false` for no
     * toolbar. Defaults to text styles, blocks and links, and lists.
     */
    formats?: readonly (readonly MarkdownFormat[])[] | false;

    /**
     * Renders the preview of the markdown. The editor ships no markdown renderer - rendering, and what
     * HTML is allowed through, belongs to the host - so the preview toggle only shows when this is given.
     * @param markdown The markdown to render. Never empty: the editor shows its own empty text instead.
     * @returns The rendered markdown.
     */
    renderPreview?: (markdown: string) => ReactNode;

    /** Autocompletions offered while their trigger is typed, such as `#` for issues or `@` for people. */
    completions?: readonly MarkdownCompletion[];

    /**
     * Uploads a file pasted or dropped into the writing area and returns the markdown that stands for
     * it, such as an image or a link. Omit to leave pasting and dropping files to the browser.
     * @param file The file to upload.
     * @returns The markdown that replaces the file's placeholder.
     */
    uploadFile?: (file: File) => Promise<string>;

    /**
     * Told about a file whose upload failed. Its placeholder has already been taken out again.
     * @param file The file that failed to upload.
     * @param error What {@link uploadFile} rejected with.
     */
    onUploadFailed?: (file: File, error: unknown) => void;

    /** Overrides for the editor's labels. Unset fields fall back to English. */
    labels?: MarkdownEditorLabels;

    /** The writing area's element id, for a `<label htmlFor>`. */
    id?: string;

    /** The writing area's accessible name. Defaults to the `editor` label unless `aria-labelledby` is given. */
    'aria-label'?: string;

    /** The id of the element naming the writing area. */
    'aria-labelledby'?: string;

    /** The id of the element describing the writing area, such as a validation message. */
    'aria-describedby'?: string;

    /** Extra class name on the editor's root. */
    className?: string;

    /** Pass-through attributes for the editor's stable parts. */
    pt?: MarkdownEditorParts;
}

/** The markdown and caret the latest edit left, read by uploads that finish later. */
interface LatestMarkdown {
    value: string;
    caret: number;
}

const editorFlags = ({ disabled = false, readOnly = false, invalid = false }: MarkdownEditorProps) => ({
    disabled,
    readOnly,
    invalid,
    editable: !disabled && !readOnly,
});

type EditorFlags = ReturnType<typeof editorFlags>;

const minHeightOf = (height: number | string = defaultHeight) => (typeof height === 'number' ? `${height}px` : height);

const initialModeOf = (props: MarkdownEditorProps) =>
    props.renderPreview ? (props.initialMode ?? MarkdownEditorMode.Write) : MarkdownEditorMode.Write;

const activeCompletions = (offered: boolean, completions: MarkdownEditorProps['completions']) =>
    offered ? (completions ?? []) : [];

const toolbarFormats = (formats: MarkdownEditorProps['formats']) => (formats === false ? [] : (formats ?? defaultMarkdownFormats));

const overlayZIndex = (nearestDialogZIndex: string | null) =>
    nearestDialogZIndex === null ? 'var(--cratis-z-index-overlay)' : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

/** The edit that inserts text at the caret the latest edit left. */
const insertionAtCaret = (latest: LatestMarkdown, text: string): MarkdownTextEdit => {
    const { value: current, caret: at } = latest;
    const position = Math.min(at, current.length);
    const caretAfter = position + text.length;
    return {
        value: `${current.slice(0, position)}${text}${current.slice(position)}`,
        selectionStart: caretAfter,
        selectionEnd: caretAfter,
    };
};

/** Restores the selection an edit asked for once the edited markdown is in the writing area. */
const restorePendingSelection = (
    pendingSelection: RefObject<MarkdownTextEdit | undefined>,
    textarea: HTMLTextAreaElement | null,
) => {
    const pending = pendingSelection.current;
    if (!pending || !textarea) return;
    if (textarea.value !== pending.value) return;
    pendingSelection.current = undefined;
    textarea.focus();
    textarea.setSelectionRange(pending.selectionStart, pending.selectionEnd);
};

const caretWhileOpen = (isOpen: boolean, textarea: HTMLTextAreaElement | null, end: number) =>
    isOpen && textarea ? caretPositionIn(textarea, end) : undefined;

/** The editor's state, selection, completion and uploads, in the order the editor has always held them. */
const useMarkdownEditorState = (props: MarkdownEditorProps, editable: boolean) => {
    const { value, onChange } = props;
    const [mode, setMode] = useState(initialModeOf(props));
    const [selection, setSelection] = useState({ start: value.length, end: value.length });
    const [caret, setCaret] = useState<CaretPosition>();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pendingSelection = useRef<MarkdownTextEdit>(undefined);
    const latest = useRef<LatestMarkdown>({ value, caret: value.length });
    latest.current.value = value;
    const baseId = useId();
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();

    const completion = useMarkdownCompletion(
        value,
        selection.start,
        selection.end,
        activeCompletions(editable && mode === MarkdownEditorMode.Write, props.completions),
    );

    const applyEdit = (edit: MarkdownTextEdit) => {
        latest.current = { value: edit.value, caret: edit.selectionEnd };
        pendingSelection.current = edit;
        setSelection({ start: edit.selectionStart, end: edit.selectionEnd });
        onChange(edit.value);
    };

    const uploads = useMarkdownUploads({
        uploadFile: editable ? props.uploadFile : undefined,
        onUploadFailed: props.onUploadFailed,
        currentValue: () => latest.current.value,
        insertAtCaret: text => applyEdit(insertionAtCaret(latest.current, text)),
        replaceValue: next => {
            latest.current = { ...latest.current, value: next };
            onChange(next);
        },
    });

    useLayoutEffect(() => {
        restorePendingSelection(pendingSelection, textareaRef.current);
    });

    // Measured before paint, so the list never flashes at the caret's previous place while typing.
    useLayoutEffect(() => {
        setCaret(caretWhileOpen(completion.isOpen, textareaRef.current, selection.end));
    }, [completion.isOpen, value, selection.end]);

    const applyFormat = (format: MarkdownFormat) => {
        const textarea = textareaRef.current;
        if (!textarea || !editable) return;
        applyEdit(applyMarkdownFormat(value, textarea.selectionStart, textarea.selectionEnd, format));
    };

    const changeSelection = (start: number, end: number) => {
        latest.current = { ...latest.current, caret: end };
        setSelection({ start, end });
    };

    const chooseSuggestion = (suggestion: MarkdownSuggestion) => {
        const edit = completion.choose(suggestion);
        if (edit) applyEdit(edit);
    };

    return {
        mode,
        setMode,
        caret,
        textareaRef,
        baseId,
        overlayEnvironment,
        nearestDialogZIndex,
        completion,
        uploads,
        applyEdit,
        applyFormat,
        changeSelection,
        chooseSuggestion,
    };
};

/** What the editor's panes render from. */
interface EditorView {
    props: MarkdownEditorProps;
    flags: EditorFlags;
    labels: Required<MarkdownEditorLabels>;
    editor: ReturnType<typeof useMarkdownEditorState>;
    suggestionsId: string;
    optionId: (index: number) => string;
}

const renderPreviewPane = ({ props, labels }: EditorView, renderPreview: (markdown: string) => ReactNode) => (
    <div
        {...props.pt?.preview}
        className={classNames('cratis-markdown-editor__preview', props.pt?.preview?.className)}
        data-cratis-part='preview'
    >
        {props.value.trim().length > 0 ? (
            renderPreview(props.value)
        ) : (
            <p className='cratis-markdown-editor__empty'>{labels.emptyPreview}</p>
        )}
    </div>
);

const renderWritingArea = ({ props, flags, labels, editor, suggestionsId, optionId }: EditorView) => (
    <MarkdownWritingArea
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        placeholder={props.placeholder}
        autoFocus={props.autoFocus}
        disabled={flags.disabled}
        readOnly={flags.readOnly}
        invalid={flags.invalid}
        id={props.id}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
        parts={props.pt?.textarea}
        textareaRef={editor.textareaRef}
        labels={labels}
        completion={editor.completion}
        uploads={editor.uploads}
        suggestionsId={suggestionsId}
        activeOptionId={editor.completion.isOpen ? optionId(editor.completion.activeIndex) : undefined}
        onSelectionChange={editor.changeSelection}
        onEdit={editor.applyEdit}
        onFormat={editor.applyFormat}
    />
);

const rootClassName = (props: MarkdownEditorProps, canPreview: boolean) =>
    classNames(
        'cratis-markdown-editor',
        canPreview && 'cratis-markdown-editor--toggleable',
        props.className,
        props.pt?.root?.className,
    );

const renderToggle = ({ props, labels, editor }: EditorView, canPreview: boolean) =>
    canPreview && (
        <MarkdownModeToggle
            mode={editor.mode}
            onModeChange={editor.setMode}
            showPreviewLabel={labels.showPreview}
            showMarkdownLabel={labels.showMarkdown}
            parts={props.pt?.toggle}
        />
    );

const renderToolbar = ({ props, flags, labels, editor }: EditorView) => {
    const formats = toolbarFormats(props.formats);
    const hasToolbar = formats.some(group => group.length > 0);
    return (
        editor.mode === MarkdownEditorMode.Write &&
        hasToolbar && (
            <MarkdownToolbar
                formats={formats}
                labels={labels}
                disabled={!flags.editable}
                onFormat={editor.applyFormat}
                parts={props.pt}
            />
        )
    );
};

const renderBody = (view: EditorView) => {
    const { renderPreview } = view.props;
    return view.editor.mode === MarkdownEditorMode.Preview && renderPreview
        ? renderPreviewPane(view, renderPreview)
        : renderWritingArea(view);
};

const renderStatus = ({ props, labels, editor }: EditorView, busy: boolean) =>
    busy && (
        <div
            {...props.pt?.status}
            role='status'
            className={classNames('cratis-markdown-editor__status', props.pt?.status?.className)}
            data-cratis-part='status'
        >
            {labels.uploading(editor.uploads.uploading)}
        </div>
    );

type OverlayContainer = ReturnType<ReturnType<typeof unstable_useOverlayEnvironment>['getContainer']>;

const renderSuggestions = ({ props, labels, editor, suggestionsId, optionId }: EditorView, container: OverlayContainer) => {
    const { completion, caret } = editor;
    return (
        completion.isOpen &&
        caret &&
        container && (
            <MarkdownSuggestionList
                id={suggestionsId}
                optionId={optionId}
                label={completion.match?.completion.label ?? labels.suggestions}
                suggestions={completion.suggestions}
                activeIndex={completion.activeIndex}
                caret={caret}
                zIndex={overlayZIndex(editor.nearestDialogZIndex)}
                container={container}
                onHighlight={completion.highlight}
                onChoose={editor.chooseSuggestion}
                renderSuggestion={completion.match?.completion.renderSuggestion}
                parts={props.pt}
            />
        )
    );
};

/**
 * A markdown editor: one bordered box holding a formatting toolbar and the writing area, with a round
 * toggle in its corner that swaps the whole box to the rendered preview. It fills the container it is
 * given, recognizes configured completion triggers at the caret, and uploads pasted or dropped files
 * through the host.
 *
 * Only one pane shows at a time: a markdown surface usually lives in a dialog or panel that is already
 * narrow, and a side-by-side preview would halve the writing width for something wanted only now and
 * then.
 */
export const MarkdownEditor = (props: MarkdownEditorProps) => {
    const flags = editorFlags(props);
    const { disabled, readOnly, invalid } = flags;
    const labels = { ...defaultMarkdownEditorLabels, ...props.labels };
    const editor = useMarkdownEditorState(props, flags.editable);
    const { baseId } = editor;

    const rootParts = props.pt?.root;
    const canPreview = props.renderPreview !== undefined;
    const suggestionsId = `${baseId}-suggestions`;
    const optionId = (index: number) => `${baseId}-suggestion-${index}`;
    const container = editor.overlayEnvironment.getContainer();
    const busy = editor.uploads.uploading.length > 0;
    const minHeight = minHeightOf(props.height);
    const view: EditorView = { props, flags, labels, editor, suggestionsId, optionId };

    return (
        <div
            {...rootParts}
            className={rootClassName(props, canPreview)}
            style={{ minHeight, ...rootParts?.style }}
            data-cratis-part='root'
            data-cratis-component='MarkdownEditor'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            data-busy={busy || undefined}
        >
            {renderToggle(view, canPreview)}
            {renderToolbar(view)}
            <div className='cratis-markdown-editor__body'>{renderBody(view)}</div>
            {renderStatus(view, busy)}
            {renderSuggestions(view, container)}
        </div>
    );
};
