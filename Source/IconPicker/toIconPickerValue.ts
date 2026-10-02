// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerValue } from './IconPickerValue';

/**
 * Reduces anything carrying a qualified identity to just that identity - never the name, preview or
 * category an entry also holds - which is what the picker emits and a host persists.
 * @param source A value or catalog entry.
 * @returns A fresh value holding `library`, `key` and, when present, `variant`.
 */
export const toIconPickerValue = (source: IconPickerValue): IconPickerValue =>
    source.variant === undefined
        ? { library: source.library, key: source.key }
        : { library: source.library, key: source.key, variant: source.variant };
