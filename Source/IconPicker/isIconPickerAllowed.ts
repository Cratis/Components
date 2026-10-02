// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerAllowed } from './IconPickerAllowed';
import type { IconPickerEntry } from './IconPickerEntry';
import { isSameIconPickerValue } from './isSameIconPickerValue';

/**
 * Tells whether a field accepts an icon.
 * @param entry The catalog entry.
 * @param allowed The field's restriction, or undefined when it accepts every icon in the catalog.
 * @returns True when the icon may be selected.
 */
export const isIconPickerAllowed = (entry: IconPickerEntry, allowed: IconPickerAllowed | undefined): boolean => {
    if (allowed === undefined) return true;
    if (typeof allowed === 'function') return allowed(entry);
    return allowed.some(value => isSameIconPickerValue(value, entry));
};
