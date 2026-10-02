// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerValue } from './IconPickerValue';

/**
 * Builds a string that is equal for two values exactly when they name the same icon.
 * @param value The qualified icon value.
 * @returns A stable identity string over `library`, `key` and `variant`.
 */
export const iconPickerIdentity = (value: IconPickerValue): string =>
    JSON.stringify([value.library, value.key, value.variant ?? null]);
