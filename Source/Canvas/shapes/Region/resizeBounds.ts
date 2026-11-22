// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ResizeStart } from './ResizeStart';

const MIN_SIZE = 100;

export const resizeBounds = (start: ResizeStart, clientX: number, clientY: number) => {
    const { handle, startX, startY, startWidth, startHeight, zoom } = start;
    const deltaX = (clientX - start.clientX) / zoom;
    const deltaY = (clientY - start.clientY) / zoom;
    let x = startX;
    let y = startY;
    let width = startWidth;
    let height = startHeight;

    if (handle.includes('e')) {
        width = Math.max(MIN_SIZE, startWidth + deltaX);
    }
    if (handle.includes('w')) {
        width = Math.max(MIN_SIZE, startWidth - deltaX);
        x = startX + startWidth - width;
    }
    if (handle.includes('s')) {
        height = Math.max(MIN_SIZE, startHeight + deltaY);
    }
    if (handle.includes('n')) {
        height = Math.max(MIN_SIZE, startHeight - deltaY);
        y = startY + startHeight - height;
    }
    return { x, y, width, height };
};
