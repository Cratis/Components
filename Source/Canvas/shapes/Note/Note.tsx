// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useOptionalMessenger } from '../../messaging/useOptionalMessenger';
import { NoteTextChanged } from './NoteTextChanged';
import { whenNoteFontReady } from './noteFont';
import { FaPlus } from 'react-icons/fa6';

const MIN_SIZE = 80;
// How small the fitted text is allowed to get. Notes live on a canvas that zooms, so text too small to
// read at 1:1 is still perfectly legible one zoom step in — shrinking is a far better answer than
// hiding the text behind an affordance, and the floor is set low enough to say so. Only text that will
// not fit even at this size falls back to the expand affordance.
const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 120;
const PADDING = 12;
const LINE_HEIGHT_RATIO = 1.4;

/** Controlled data rendered by {@link Note}. */
export interface NoteData {
    /** Stable note identity. */
    id: string;
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
    /** Note width. */
    width: number;
    /** Note height. */
    height: number;
    /** Editable note text. */
    text: string;
}

interface FontFit {
    fontSize: number;
    /** True when the text still does not fit at MIN_FONT_SIZE — the note needs the expand affordance. */
    overflows: boolean;
}

function textFitsAtSize(
    measurer: HTMLDivElement,
    text: string,
    fontSize: number,
    availableWidth: number,
    availableHeight: number,
): boolean {
    measurer.style.width = `${availableWidth}px`;
    measurer.style.fontSize = `${fontSize}px`;
    measurer.style.lineHeight = `${LINE_HEIGHT_RATIO}`;
    measurer.textContent = text;
    return measurer.scrollHeight <= availableHeight;
}

function findOptimalFontSize(
    measurer: HTMLDivElement,
    text: string,
    width: number,
    height: number,
): FontFit {
    if (!(text ?? '').trim())
        return {
            fontSize: Math.min(MAX_FONT_SIZE, Math.min(width, height) * 0.4),
            overflows: false,
        };

    const availableWidth = width - PADDING * 2;
    const availableHeight = height - PADDING * 2;

    let low = MIN_FONT_SIZE;
    let high = MAX_FONT_SIZE;

    // Quick check: if the readability floor doesn't fit, stop shrinking and flag the overflow instead.
    if (!textFitsAtSize(measurer, text, low, availableWidth, availableHeight)) {
        return { fontSize: MIN_FONT_SIZE, overflows: true };
    }

    // Binary search for the largest fitting font size
    while (high - low > 0.5) {
        const mid = (low + high) / 2;
        if (textFitsAtSize(measurer, text, mid, availableWidth, availableHeight)) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return { fontSize: Math.floor(low), overflows: false };
}

const HANDLE_KEYS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type HandleKey = (typeof HANDLE_KEYS)[number];

const HANDLE_POSITIONS: Record<HandleKey, React.CSSProperties> = {
    nw: { top: -4, left: -4 },
    n: { top: -4, left: '50%', transform: 'translateX(-50%)' },
    ne: { top: -4, right: -4 },
    e: { top: '50%', right: -4, transform: 'translateY(-50%)' },
    se: { bottom: -4, right: -4 },
    s: { bottom: -4, left: '50%', transform: 'translateX(-50%)' },
    sw: { bottom: -4, left: -4 },
    w: { top: '50%', left: -4, transform: 'translateY(-50%)' },
};

const RESIZE_CURSORS: Record<HandleKey, string> = {
    nw: 'nw-resize',
    n: 'n-resize',
    ne: 'ne-resize',
    e: 'e-resize',
    se: 'se-resize',
    s: 's-resize',
    sw: 'sw-resize',
    w: 'w-resize',
};

/** Props for a fully controlled movable, resizable, editable Canvas note. */
export interface NoteProps {
    /** Current note data. */
    note: NoteData;
    /** Whether selection handles are visible. */
    selected: boolean;

    /**
     * Selects this note. `additive` reports that the gesture carried a shift/meta/ctrl modifier, so a
     * board supporting multi-select can extend its selection instead of replacing it.
     */
    onSelect: (id: string, additive: boolean) => void;

    /** Reports drag movement. */
    onMove: (id: string, x: number, y: number) => void;
    /** Reports drag completion. */
    onMoveEnd?: (id: string) => void;
    /** Reports resize movement and the resulting bounds. */
    onResize: (id: string, x: number, y: number, width: number, height: number) => void;
    /** Reports resize completion. */
    onResizeEnd?: (id: string) => void;
    /** Reports committed text edits. */
    onTextChange: (id: string, text: string) => void;

    /**
     * Reports that the note grew to show all of its text, or shrank back. An expanded note reaches over
     * whatever sits below it, so the host has to raise it above its siblings for the duration — a note
     * renders inside its own stacking context, so it cannot do that for itself.
     */
    onExpandedChange?: (id: string, isExpanded: boolean) => void;
}

/**
 * A fully controlled movable, resizable, editable Canvas note with automatic font fitting. Text
 * shrinks to fit the note's bounds; when it no longer fits even at the readability floor, a "see full
 * text" button grows the note temporarily. Double-click to edit, drag to move, drag handles to resize.
 */
export const Note: React.FC<NoteProps> = ({
    note,
    selected,
    onSelect,
    onMove,
    onMoveEnd,
    onResize,
    onResizeEnd,
    onTextChange,
    onExpandedChange,
}) => {
    // Opt-in messaging: resolves to undefined without an Arc messenger, and the publish below then
    // simply does not happen — the `onTextChange` callback remains the note's contract either way.
    const publish = useOptionalMessenger();
    const noteRef = useRef<HTMLDivElement>(null);
    const measurerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [liveText, setLiveText] = useState(note.text);
    const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);
    const [textareaTopPadding, setTextareaTopPadding] = useState(PADDING);
    // True once the text no longer fits even at the readability floor — shows the "see full text" button.
    const [isOverflowing, setIsOverflowing] = useState(false);
    // The height the note needs to show every line of its text at the fitted size.
    const [fullTextHeight, setFullTextHeight] = useState(0);
    const [isShowingFullText, setIsShowingFullText] = useState(false);
    // The note face is a webfont, so the first measurement can land against the fallback's metrics.
    // Flipping this re-runs the fit once the real face is in.
    const [isFontReady, setIsFontReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void whenNoteFontReady().then(() => {
            if (!cancelled) setIsFontReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const dragRef = useRef<{
        clientX: number;
        clientY: number;
        startX: number;
        startY: number;
        zoom: number;
    } | null>(null);

    const resizeRef = useRef<{
        handle: HandleKey;
        clientX: number;
        clientY: number;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        zoom: number;
    } | null>(null);

    const readEffectiveZoom = useCallback((): number => {
        if (!noteRef.current) return 1;
        const renderedWidth = noteRef.current.getBoundingClientRect().width;
        return renderedWidth > 0 ? renderedWidth / note.width : 1;
    }, [note.width]);

    // ── Move ────────────────────────────────────────────────────────────────

    const handlePointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isEditing) return;
            event.stopPropagation();
            onSelect(note.id, event.shiftKey || event.metaKey || event.ctrlKey);
            dragRef.current = {
                clientX: event.clientX,
                clientY: event.clientY,
                startX: note.x,
                startY: note.y,
                zoom: readEffectiveZoom(),
            };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [isEditing, note.id, note.x, note.y, onSelect, readEffectiveZoom],
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragRef.current || !event.buttons) return;
            const { clientX, clientY, startX, startY, zoom } = dragRef.current;
            const deltaX = (event.clientX - clientX) / zoom;
            const deltaY = (event.clientY - clientY) / zoom;
            onMove(note.id, startX + deltaX, startY + deltaY);
        },
        [note.id, onMove],
    );

    const handlePointerUp = useCallback(() => {
        if (dragRef.current) {
            dragRef.current = null;
            onMoveEnd?.(note.id);
        }
    }, [note.id, onMoveEnd]);

    // ── Resize ──────────────────────────────────────────────────────────────

    const handleResizePointerDown = useCallback(
        (handle: HandleKey) => (event: React.PointerEvent<HTMLDivElement>) => {
            event.stopPropagation();
            resizeRef.current = {
                handle,
                clientX: event.clientX,
                clientY: event.clientY,
                startX: note.x,
                startY: note.y,
                startWidth: note.width,
                startHeight: note.height,
                zoom: readEffectiveZoom(),
            };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [note.x, note.y, note.width, note.height, readEffectiveZoom],
    );

    const handleResizePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!resizeRef.current || !event.buttons) return;
            const {
                handle,
                clientX,
                clientY,
                startX,
                startY,
                startWidth,
                startHeight,
                zoom,
            } = resizeRef.current;
            const deltaX = (event.clientX - clientX) / zoom;
            const deltaY = (event.clientY - clientY) / zoom;

            let newX = startX;
            let newY = startY;
            let newWidth = startWidth;
            let newHeight = startHeight;

            if (handle === 'e' || handle === 'ne' || handle === 'se') {
                newWidth = Math.max(MIN_SIZE, startWidth + deltaX);
            }
            if (handle === 'w' || handle === 'nw' || handle === 'sw') {
                newWidth = Math.max(MIN_SIZE, startWidth - deltaX);
                newX = startX + startWidth - newWidth;
            }
            if (handle === 's' || handle === 'se' || handle === 'sw') {
                newHeight = Math.max(MIN_SIZE, startHeight + deltaY);
            }
            if (handle === 'n' || handle === 'ne' || handle === 'nw') {
                newHeight = Math.max(MIN_SIZE, startHeight - deltaY);
                newY = startY + startHeight - newHeight;
            }

            onResize(note.id, newX, newY, newWidth, newHeight);
        },
        [note.id, onResize],
    );

    const handleResizePointerUp = useCallback(() => {
        if (resizeRef.current) {
            resizeRef.current = null;
            onResizeEnd?.(note.id);
        }
    }, [note.id, onResizeEnd]);

    // ── Text editing ────────────────────────────────────────────────────────

    const handleDoubleClick = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
            setLiveText(note.text);
            setIsEditing(true);
        },
        [note.text],
    );

    const handleTextareaChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setLiveText(event.currentTarget.value);
        },
        [],
    );

    const handleTextareaBlur = useCallback(
        (event: React.FocusEvent<HTMLTextAreaElement>) => {
            const text = event.currentTarget.value;
            onTextChange(note.id, text);
            // Published at the same commit point as the callback — once per committed edit, never
            // per keystroke — for hosts that listen on the messenger instead of (or besides) props.
            publish?.(new NoteTextChanged(note.id, text));
            setIsEditing(false);
        },
        [note.id, onTextChange, publish],
    );

    const handleTextareaKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Escape') {
                setIsEditing(false);
            }
        },
        [],
    );

    // Use live text for font sizing when editing, otherwise use committed text
    const displayText = isEditing ? liveText : note.text;

    // Measure optimal font size using an off-screen div that mirrors the note's
    // word-wrap behavior. Runs synchronously before paint so there is no flash.
    // Also measures actual text height so the textarea can be vertically centred.
    useLayoutEffect(() => {
        if (!measurerRef.current) return;
        const { fontSize: optimal, overflows } = findOptimalFontSize(
            measurerRef.current,
            displayText,
            note.width,
            note.height,
        );
        setFontSize(optimal);
        setIsOverflowing(overflows);

        // After finding the font, read the actual rendered text height to compute
        // vertical padding that centres the text inside the textarea.
        const measurer = measurerRef.current;
        measurer.style.width = `${note.width - PADDING * 2}px`;
        measurer.style.fontSize = `${optimal}px`;
        measurer.style.lineHeight = `${LINE_HEIGHT_RATIO}`;
        measurer.textContent = displayText || '\u00A0';
        const renderedHeight = measurer.scrollHeight;
        const topPad = Math.max(PADDING, (note.height - renderedHeight) / 2);
        setTextareaTopPadding(topPad);
        // The same measurement answers how tall the note has to grow to show everything.
        setFullTextHeight(renderedHeight + PADDING * 2);
    }, [displayText, note.width, note.height, isFontReady]);

    const isExpanded = isShowingFullText && isOverflowing && !isEditing;

    // Editing, retyping or resizing the note re-fits the text, and the note may well fit again — the
    // grown state belongs to the text that no longer fits, so it never outlives it.
    useEffect(() => {
        if (!isOverflowing) setIsShowingFullText(false);
    }, [isOverflowing]);

    useEffect(() => {
        onExpandedChange?.(note.id, isExpanded);
    }, [isExpanded, note.id, onExpandedChange]);

    const handleExpand = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setIsShowingFullText(true);
    }, []);

    // Growing is a look, not a mode: the note falls back to its own size the moment the pointer leaves it.
    const handlePointerLeave = useCallback(() => setIsShowingFullText(false), []);

    return (
        <div
            ref={noteRef}
            className={`canvas-note${selected ? ' canvas-note--selected' : ''}${isExpanded ? ' canvas-note--expanded' : ''}`}
            style={{
                width: note.width,
                height: isExpanded ? Math.max(note.height, fullTextHeight) : note.height,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onDoubleClick={handleDoubleClick}
        >
            {/* Off-screen measurement div — mirrors text styling for accurate fitting */}
            <div ref={measurerRef} className='canvas-note__measurer' aria-hidden='true' />

            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    className='canvas-note__textarea'
                    value={liveText}
                    style={{
                        fontSize,
                        lineHeight: LINE_HEIGHT_RATIO,
                        paddingTop: textareaTopPadding,
                        paddingBottom: textareaTopPadding,
                    }}
                    autoFocus
                    onChange={handleTextareaChange}
                    onBlur={handleTextareaBlur}
                    onKeyDown={handleTextareaKeyDown}
                    onPointerDown={(event) => event.stopPropagation()}
                />
            ) : (
                <p className='canvas-note__text' style={{ fontSize }}>
                    {note.text}
                </p>
            )}

            {isOverflowing && !isEditing && !isExpanded && (
                <button
                    type='button'
                    className='canvas-note__expand'
                    aria-label='See full text'
                    title='See full text'
                    onClick={handleExpand}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <FaPlus aria-hidden='true' />
                </button>
            )}

            {/* The handles resize from the note's own height, so they stay off while it is showing more
                than that — dragging one would otherwise snap the note back to its real size first. */}
            {selected &&
                !isExpanded &&
                HANDLE_KEYS.map((handle) => (
                    <div
                        key={handle}
                        className='canvas-note__handle'
                        style={{
                            ...HANDLE_POSITIONS[handle],
                            cursor: RESIZE_CURSORS[handle],
                        }}
                        onPointerDown={handleResizePointerDown(handle)}
                        onPointerMove={handleResizePointerMove}
                        onPointerUp={handleResizePointerUp}
                        onPointerCancel={handleResizePointerUp}
                    />
                ))}
        </div>
    );
};
