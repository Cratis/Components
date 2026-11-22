// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useCallback, useRef } from 'react';
import { FaPlus } from 'react-icons/fa6';
import type { NoteProps } from './NoteProps';
import { useNoteEditing } from './useNoteEditing';
import { useNoteTextLayout } from './useNoteTextLayout';
import { useNoteExpansion } from './useNoteExpansion';
import { useNoteMove } from './useNoteMove';
import { useNoteResize } from './useNoteResize';
import { renderHandles } from './renderHandles';
import { LINE_HEIGHT_RATIO } from './textMetrics';

export type { NoteData } from './NoteData';
export type { NoteProps } from './NoteProps';

/**
 * A fully controlled movable, resizable, editable Canvas note with automatic font fitting. Text
 * shrinks to fit the note's bounds; when it no longer fits even at the readability floor, a "see full
 * text" button grows the note temporarily. Double-click to edit, drag to move, drag handles to resize.
 */
export const Note: React.FC<NoteProps> = (props) => {
    const { note, selected } = props;
    const editing = useNoteEditing(props);
    const noteRef = useRef<HTMLDivElement>(null);
    const { measurerRef, fontSize, textareaTopPadding, isOverflowing, fullTextHeight } = useNoteTextLayout(note, editing.displayText);
    const { isExpanded, handleExpand, handlePointerLeave } = useNoteExpansion(props, isOverflowing, editing.isEditing);
    const readEffectiveZoom = useCallback((): number => {
        if (!noteRef.current) return 1;
        const renderedWidth = noteRef.current.getBoundingClientRect().width;
        return renderedWidth > 0 ? renderedWidth / note.width : 1;
    }, [note.width]);
    const { handlePointerDown, handlePointerMove, handlePointerUp } = useNoteMove(props, editing.isEditing, readEffectiveZoom);
    const resize = useNoteResize(props, readEffectiveZoom);

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
            onDoubleClick={editing.handleDoubleClick}
        >
            {/* Off-screen measurement div — mirrors text styling for accurate fitting */}
            <div ref={measurerRef} className='canvas-note__measurer' aria-hidden='true' />

            {editing.isEditing ? (
                <textarea
                    ref={editing.textareaRef}
                    className='canvas-note__textarea'
                    value={editing.liveText}
                    style={{
                        fontSize,
                        lineHeight: LINE_HEIGHT_RATIO,
                        paddingTop: textareaTopPadding,
                        paddingBottom: textareaTopPadding,
                    }}
                    autoFocus
                    onChange={editing.handleTextareaChange}
                    onBlur={editing.handleTextareaBlur}
                    onKeyDown={editing.handleTextareaKeyDown}
                    onPointerDown={(event) => event.stopPropagation()}
                />
            ) : (
                <p className='canvas-note__text' style={{ fontSize }}>{note.text}</p>
            )}

            {isOverflowing && !editing.isEditing && !isExpanded && (
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
            {selected && !isExpanded && renderHandles(resize)}
        </div>
    );
};
