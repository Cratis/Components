// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerValue } from './IconPickerValue';

/**
 * Writes a qualified identity out for people, as shown for a selection the catalog does not contain.
 * @param value The qualified icon value.
 * @returns The library, key and variant joined with slashes.
 */
export const formatIconPickerIdentity = (value: IconPickerValue): string =>
    [value.library, value.key, value.variant].filter(part => part !== undefined && part !== '').join(' / ');
