// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ConfigurationIconReference } from './ConfigurationIconReference';
import type { OrderedItem } from './OrderedItem';

/**
 * What the editor hands to `renderIconField`. The host renders its icon chooser with it and
 * reports the choice through {@link OrderedItemIconFieldProps.onChange}; the editor turns that into
 * a validated proposal, or ignores it when the field is not editable.
 */
export interface OrderedItemIconFieldProps<TItem extends OrderedItem = OrderedItem> {
    /** The item being edited. */
    item: TItem;

    /** The item's current icon. */
    value: ConfigurationIconReference | undefined;

    /** Reports the icon the person picked. */
    onChange: (icon: ConfigurationIconReference) => void;

    /** Whether the person can change the icon. */
    readOnly: boolean;

    /** The accessible name of the field, including the item it belongs to. */
    'aria-label': string;

    /** The id of the element that describes the field, which holds its validation message. */
    'aria-describedby'?: string;

    /** Whether the field has a validation message. */
    invalid: boolean;

    /** The validation message, if any. */
    validationMessage?: string;
}
