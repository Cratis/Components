// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, type PointerEvent, type RefObject } from 'react';
import type { RegionProps } from './Region';
import type { HandleKey } from './HandleKey';
import type { ResizeStart } from './ResizeStart';
import { resizeBounds } from './resizeBounds';

export const useRegionResize = (
    { region, onResize, onResizeEnd }: Pick<RegionProps, 'region' | 'onResize' | 'onResizeEnd'>,
    clickedTitleBarRef: RefObject<boolean>,
    readEffectiveZoom: () => number,
) => {
    const resizeRef = useRef<ResizeStart | null>(null);
    const handleResizePointerDown = useCallback((handle: HandleKey) => (event: PointerEvent<HTMLDivElement>) => {
        clickedTitleBarRef.current = false;
        event.stopPropagation();
        resizeRef.current = {
            handle, clientX: event.clientX, clientY: event.clientY,
            startX: region.x, startY: region.y, startWidth: region.width, startHeight: region.height,
            zoom: readEffectiveZoom(),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, [region.x, region.y, region.width, region.height, readEffectiveZoom, clickedTitleBarRef]);

    const handleResizePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (!resizeRef.current || !event.buttons) return;
        const { x, y, width, height } = resizeBounds(resizeRef.current, event.clientX, event.clientY);
        onResize(region.id, x, y, width, height);
    }, [region.id, onResize]);

    const handleResizePointerUp = useCallback(() => {
        if (resizeRef.current) {
            resizeRef.current = null;
            onResizeEnd?.(region.id);
        }
    }, [region.id, onResizeEnd]);

    return { handleResizePointerDown, handleResizePointerMove, handleResizePointerUp };
};
