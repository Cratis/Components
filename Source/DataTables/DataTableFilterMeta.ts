// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Filter state for a Cratis data table, keyed by field name. Kept as a loose
 * record so callers can seed saved/URL-encoded filter state; replaces
 * PrimeReact 10's `DataTableFilterMeta` (removed in PrimeReact 11).
 */
export type DataTableFilterMeta = Record<string, unknown>;
