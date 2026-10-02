// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ConfigurationIconReference } from './ConfigurationIconReference';

/**
 * One entry of an ordered collection, such as an item of a navigation component. Hosts extend this
 * with their own properties; the editor carries them through every proposal unchanged.
 */
export interface OrderedItem {
    /** Stable identity that survives rename and reorder. Assigned by the host, never by the editor. */
    id: string;

    /** Localizable text shown for the item. */
    label: string;

    /** The item's icon, if it has one. */
    icon?: ConfigurationIconReference;

    /** The id of the item's {@link ConfigurationDestination}, if it has one. */
    destination?: string;
}
