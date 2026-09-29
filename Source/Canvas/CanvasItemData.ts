// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Minimum data shape for an optional Pixi-rendered canvas item. */
export interface CanvasItemData {
    /** Stable item identity. */
    id: string;
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
}
