// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The qualified, persisted identity of an icon: the shape a host stores and the picker emits.
 *
 * Labels, display names, CSS classes, SVG markup and catalog order are never identity. Two values name
 * the same icon only when `library`, `key` and `variant` all match, so an icon called `home` in one
 * library is never mistaken for an icon called `home` in another.
 */
export interface IconPickerValue {
    /** The stable identity of the icon library the icon belongs to. */
    library: string;

    /** The stable key of the icon within its library. */
    key: string;

    /** The optional style variant of the icon, such as `outline` or `solid`. */
    variant?: string;
}
