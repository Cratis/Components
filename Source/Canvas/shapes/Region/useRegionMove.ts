// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, type PointerEvent } from 'react';
import type { RegionProps } from './Region';
import type { useRegionEditing } from './useRegionEditing';

export const useRegionMove = (
    { region, onSelect, onMove, onMoveEnd }: Pick<RegionProps, 'region' | 'onSelect' | 'onMove' | 'onMoveEnd'>,
    { isEditing, titleBarRef, clickedTitleBarRef }: ReturnType<typeof useRegionEditing>,
    readEffectiveZoom: () => number,
) => {
    const dragRef = useRef<{
        clientX: number;
        clientY: number;
        startX: number;
        startY: number;
        zoom: number;
    } | null>(null);

    // Only the title bar starts a drag. Body gestures bubble to the host for rubber-band or plain
    // selection rather than being swallowed by this backdrop.
    const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (isEditing) return;
        clickedTitleBarRef.current = titleBarRef.current?.contains(event.target as Node) ?? false;
        if (!clickedTitleBarRef.current) return;
        event.stopPropagation();
        onSelect(region.id, event.shiftKey || event.metaKey || event.ctrlKey);
        dragRef.current = {
            clientX: event.clientX, clientY: event.clientY,
            startX: region.x, startY: region.y, zoom: readEffectiveZoom(),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [isEditing, region.id, region.x, region.y, onSelect, readEffectiveZoom, titleBarRef, clickedTitleBarRef]);

    const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current || !event.buttons) return;
        const { clientX, clientY, startX, startY, zoom } = dragRef.current;
        const deltaX = (event.clientX - clientX) / zoom;
        const deltaY = (event.clientY - clientY) / zoom;
        onMove(region.id, startX + deltaX, startY + deltaY);
    }, [region.id, onMove]);

    const handlePointerUp = useCallback(() => {
        if (dragRef.current) {
            dragRef.current = null;
            onMoveEnd?.(region.id);
        }
    }, [region.id, onMoveEnd]);

    return { handlePointerDown, handlePointerMove, handlePointerUp };
};
