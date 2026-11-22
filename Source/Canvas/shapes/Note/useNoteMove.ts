// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, type PointerEvent } from 'react';
import type { NoteProps } from './NoteProps';

export const useNoteMove = (
    { note, onSelect, onMove, onMoveEnd }: NoteProps,
    isEditing: boolean,
    readEffectiveZoom: () => number,
) => {
    const dragRef = useRef<{
        clientX: number;
        clientY: number;
        startX: number;
        startY: number;
        zoom: number;
    } | null>(null);

    const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (isEditing) return;
        event.stopPropagation();
        onSelect(note.id, event.shiftKey || event.metaKey || event.ctrlKey);
        dragRef.current = {
            clientX: event.clientX, clientY: event.clientY,
            startX: note.x, startY: note.y, zoom: readEffectiveZoom(),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [isEditing, note.id, note.x, note.y, onSelect, readEffectiveZoom]);

    const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current || !event.buttons) return;
        const { clientX, clientY, startX, startY, zoom } = dragRef.current;
        const deltaX = (event.clientX - clientX) / zoom;
        const deltaY = (event.clientY - clientY) / zoom;
        onMove(note.id, startX + deltaX, startY + deltaY);
    }, [note.id, onMove]);

    const handlePointerUp = useCallback(() => {
        if (dragRef.current) {
            dragRef.current = null;
            onMoveEnd?.(note.id);
        }
    }, [note.id, onMoveEnd]);

    return { handlePointerDown, handlePointerMove, handlePointerUp };
};
