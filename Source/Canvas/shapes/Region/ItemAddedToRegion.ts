// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Published over the Arc messenger by a {@link Region} when a sibling `CanvasItem` carrying an `id`
 * newly has its center point within the region's bounds — whether the item moved into the region or
 * the region moved/resized over the item. Purely a notification: the region does not move the item,
 * persist anything, or know what the item is. Overlapping regions may each claim the same item; the
 * host owns resolving exclusivity, and owns whatever "membership" means on its board.
 */
export class ItemAddedToRegion {
    constructor(
        readonly regionId: string,
        readonly itemId: string,
    ) {}
}
