// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerValue } from './IconPickerValue';

/**
 * Compares two qualified icon values. All three fields decide: the same key in another library, or
 * the same key and library in another variant, is a different icon.
 * @param left The first value.
 * @param right The second value.
 * @returns True when both name the same icon.
 */
export const isSameIconPickerValue = (left: IconPickerValue, right: IconPickerValue): boolean =>
    left.library === right.library && left.key === right.key && left.variant === right.variant;
