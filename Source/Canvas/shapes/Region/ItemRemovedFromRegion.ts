// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Published over the Arc messenger by a {@link Region} when a sibling `CanvasItem` carrying an `id`
 * that was within the region's bounds no longer is — whether the item moved out, the region
 * moved/resized away from it, or the item unmounted. The counterpart of {@link ItemAddedToRegion};
 * the same notification-only boundary applies.
 */
export class ItemRemovedFromRegion {
    constructor(
        readonly regionId: string,
        readonly itemId: string,
    ) {}
}
