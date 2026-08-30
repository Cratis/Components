// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Cratis-owned selected-row key map. */
export type SelectionKeys = Record<string, boolean>;

/** Builds a single selected-row key map. */
export function selectionKeysForRow<TData extends object>(
    selection: TData | null | undefined,
    dataKey: string | undefined,
): SelectionKeys {
    if (!selection || !dataKey) return {};
    return { [String((selection as Record<string, unknown>)[dataKey])]: true };
}

/** Resolves a row from a selected-row key map. */
export function rowFromSelectionKeys<TData extends object>(
    keys: SelectionKeys,
    data: TData[],
    dataKey: string | undefined,
): TData | null {
    if (!dataKey) return null;
    const selectedKey = Object.keys(keys).find((key) => keys[key]);
    if (selectedKey === undefined) return null;
    return (
        data.find(
            (row) => String((row as Record<string, unknown>)[dataKey]) === selectedKey,
        ) ?? null
    );
}
