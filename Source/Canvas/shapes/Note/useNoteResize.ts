// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, type PointerEvent } from 'react';
import type { NoteHandle } from './NoteHandle';
import type { NoteProps } from './NoteProps';
import type { ResizeStart } from './ResizeStart';
import { resizeBounds } from './resizeBounds';

export const useNoteResize = ({ note, onResize, onResizeEnd }: NoteProps, readEffectiveZoom: () => number) => {
    const resizeRef = useRef<ResizeStart | null>(null);
    const handleResizePointerDown = useCallback((handle: NoteHandle) => (event: PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        resizeRef.current = {
            handle, clientX: event.clientX, clientY: event.clientY,
            startX: note.x, startY: note.y, startWidth: note.width, startHeight: note.height,
            zoom: readEffectiveZoom(),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [note.x, note.y, note.width, note.height, readEffectiveZoom]);

    const handleResizePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (!resizeRef.current || !event.buttons) return;
        const { x, y, width, height } = resizeBounds(resizeRef.current, event.clientX, event.clientY);
        onResize(note.id, x, y, width, height);
    }, [note.id, onResize]);

    const handleResizePointerUp = useCallback(() => {
        if (resizeRef.current) {
            resizeRef.current = null;
            onResizeEnd?.(note.id);
        }
    }, [note.id, onResizeEnd]);

    return { handleResizePointerDown, handleResizePointerMove, handleResizePointerUp };
};
