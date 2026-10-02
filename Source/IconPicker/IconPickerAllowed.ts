// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerValue } from './IconPickerValue';

/**
 * Which icons a field accepts: a list of qualified values, or a predicate over catalog entries.
 * Icons outside it stay visible in the popout but cannot be selected.
 */
export type IconPickerAllowed = readonly IconPickerValue[] | ((entry: IconPickerEntry) => boolean);
