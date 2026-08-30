// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SyntheticEvent } from 'react';

/**
 * Fired when the selected row of a Cratis data table changes. Replaces
 * the legacy renderer's single-selection event.
 * The `value` field is preserved so existing `event.value` call sites keep
 * working.
 *
 * @typeParam TData - The row type.
 */
export interface DataTableSelectionChangeEvent<TData> {
    /** The newly-selected row, or `null` when the selection was cleared. */
    value: TData | null;
    /** The DOM event that triggered the change, when available. */
    originalEvent?: SyntheticEvent;
}
