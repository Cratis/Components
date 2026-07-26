// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * One field's filter constraint: the value to match and the match mode
 * (`'contains'`, `'equals'`, `'gt'`, …). `matchMode` is optional so callers can
 * seed a value-only filter.
 */
export interface DataTableFilterConstraint {
    /** The value to filter by. */
    value: unknown;
    /** How the value is compared. Defaults to the column's default match mode. */
    matchMode?: string;
}

/**
 * Filter state for a Cratis data table, keyed by field name. Replaces
 * PrimeReact 10's `DataTableFilterMeta` (removed in PrimeReact 11) with a typed
 * per-field constraint so `defaultFilters` autocompletes and type-checks.
 */
export type DataTableFilterMeta = Record<string, DataTableFilterConstraint>;
