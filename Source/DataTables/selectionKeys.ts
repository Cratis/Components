// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SelectionKeys } from '@primereact/types/headless/datatable';

/**
 * Builds PrimeReact 11's key-based selection map for a single selected row —
 * `{ [String(row[dataKey])]: true }` — or an empty map when nothing is
 * selected or no `dataKey` is set. This is the write side of the object↔key
 * translation the Cratis tables use to keep a row-object selection API over
 * v11's key-based model.
 *
 * @typeParam TData - The row type.
 */
export function selectionKeysForRow<TData extends object>(
    selection: TData | null | undefined,
    dataKey: string | undefined
): SelectionKeys {
    if (!selection || !dataKey) return {};
    return { [String((selection as Record<string, unknown>)[dataKey])]: true };
}

/**
 * The read side: resolves the row object matching the single `true` key in a
 * PrimeReact 11 selection-keys map, or `null` when the selection is cleared or
 * the key is not in `data`.
 *
 * @typeParam TData - The row type.
 */
export function rowFromSelectionKeys<TData extends object>(
    keys: SelectionKeys,
    data: TData[],
    dataKey: string | undefined
): TData | null {
    if (!dataKey) return null;
    const selectedKey = Object.keys(keys).find(key => keys[key]);
    if (selectedKey === undefined) return null;
    return data.find(row => String((row as Record<string, unknown>)[dataKey]) === selectedKey) ?? null;
}
