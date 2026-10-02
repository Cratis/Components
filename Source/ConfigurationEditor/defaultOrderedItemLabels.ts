// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { OrderedItemLabels } from './OrderedItemLabels';

/** The English strings the {@link OrderedItemEditor} falls back to. */
export const defaultOrderedItemLabels: Required<OrderedItemLabels> = {
    fixedItems: 'Fixed items',
    localItems: 'Items',
    locked: 'Locked',
    empty: 'No items yet.',
    add: 'Add item',
    maxItemsReached: 'The maximum number of items has been reached.',
    labelField: 'Label',
    iconField: 'Icon',
    destinationField: 'Destination',
    noDestination: 'No destination',
    noIcon: 'No icon',
    iconUnavailable: 'This icon is no longer available.',
    destinationUnavailable: 'This destination is no longer available.',
    labelRequired: 'Enter a label.',
    remove: (itemLabel) => `Remove ${itemLabel}`,
    moveUp: (itemLabel) => `Move ${itemLabel} up`,
    moveDown: (itemLabel) => `Move ${itemLabel} down`,
    handle: (itemLabel) => `Reorder ${itemLabel}. Press the up or down arrow key to move it.`,
    untitled: 'Untitled item',
    moved: (itemLabel, position, total) => `${itemLabel} moved to position ${position} of ${total}.`,
};
