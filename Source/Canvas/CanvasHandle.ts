// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MinimapItem } from './CanvasMinimap';

/** Imperative camera and measurement operations exposed by {@link Canvas}. */
export interface CanvasHandle {
    /** Smoothly centers a world point. */
    smoothPanToWorld(worldX: number, worldY: number, durationMs?: number): void;
    /** Smoothly centers a world point while animating to a target zoom. */
    smoothPanZoomToWorld(
        worldX: number,
        worldY: number,
        targetZoom?: number,
        durationMs?: number,
    ): void;
    /** Returns the current viewport rectangle, or `null` before mounting. */
    getContainerRect(): DOMRect | null;
    /** Returns world-space bounds for every registered CanvasItem. */
    getItemBounds(): MinimapItem[];
}
