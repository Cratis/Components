// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Every visible and accessible string the {@link OrderedItemEditor} owns. Unset fields fall back to
 * English. Functions receive the item's label so each control names the item it acts on.
 */
export interface OrderedItemLabels {
    /** Heading of the fixed (inherited) items section. */
    fixedItems?: string;
    /** Heading of the configurable items section. */
    localItems?: string;
    /** Text shown on every locked item. */
    locked?: string;
    /** Shown when the configurable collection is empty. */
    empty?: string;
    /** The add action. */
    add?: string;
    /** Why the add action is unavailable once `maxItems` is reached. */
    maxItemsReached?: string;
    /** Accessible name of the label input. */
    labelField?: string;
    /** Accessible name of the icon field. */
    iconField?: string;
    /** Accessible name of the destination select. */
    destinationField?: string;
    /** Placeholder option of the destination select. */
    noDestination?: string;
    /** Shown instead of an icon that has none. */
    noIcon?: string;
    /** Shown for an icon the host's catalog can no longer supply. */
    iconUnavailable?: string;
    /** Shown for a destination the host no longer lists. */
    destinationUnavailable?: string;
    /** Message for a blank label. */
    labelRequired?: string;
    /** Accessible name of the remove action for an item. */
    remove?: (itemLabel: string) => string;
    /** Accessible name of the move-up action for an item. */
    moveUp?: (itemLabel: string) => string;
    /** Accessible name of the move-down action for an item. */
    moveDown?: (itemLabel: string) => string;
    /** Accessible name of the drag and keyboard handle of an item. */
    handle?: (itemLabel: string) => string;
    /** Name used for an item whose label is blank. */
    untitled?: string;
    /** Live announcement after an item moved. */
    moved?: (itemLabel: string, position: number, total: number) => string;
}
