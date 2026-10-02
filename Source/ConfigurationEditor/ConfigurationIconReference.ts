// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A qualified, renderer-neutral reference to one icon. Labels, display names, CSS classes, markup
 * and catalog order are never identity: two references are the same icon when `library`, `key` and
 * `variant` all match.
 *
 * The shape is structural, so a host can pass the reference its icon library produces straight
 * through without conversion.
 */
export interface ConfigurationIconReference {
    /** Stable identity of the icon library the icon belongs to. */
    library: string;

    /** Stable identity of the icon inside its library. */
    key: string;

    /** Optional style variant of the icon. */
    variant?: string;
}
