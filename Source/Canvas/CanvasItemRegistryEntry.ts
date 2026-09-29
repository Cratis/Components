// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Measured world-space bounds for one registered {@link CanvasItem}. */
export interface CanvasItemRegistryEntry {
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
    /** Measured width. */
    width: number;
    /** Measured height. */
    height: number;

    /**
     * Whether this entry is registered under an internally generated id rather than one the caller
     * supplied through {@link CanvasItem}'s `id` prop. An anonymous entry still feeds every consumer
     * of the registry — the minimap, fit-to-content — but `Region` (via `itemsWithinRegion`) never
     * reports it as a region member, since there is no caller-owned id a host could recognize it by.
     */
    anonymous?: boolean;
}
