// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ResizeStart } from './ResizeStart';

const MIN_SIZE = 80;

const resizeAxis = (position: number, size: number, delta: number, direction: number) => {
    if (direction === 0) return { position, size };
    const resized = Math.max(MIN_SIZE, size + direction * delta);
    return { position: direction < 0 ? position + size - resized : position, size: resized };
};

export const resizeBounds = (start: ResizeStart, clientX: number, clientY: number) => {
    const { handle, startX, startY, startWidth, startHeight, zoom } = start;
    const deltaX = (clientX - start.clientX) / zoom;
    const deltaY = (clientY - start.clientY) / zoom;
    const horizontal = resizeAxis(startX, startWidth, deltaX, handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0);
    const vertical = resizeAxis(startY, startHeight, deltaY, handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0);
    return { x: horizontal.position, y: vertical.position, width: horizontal.size, height: vertical.size };
};
