// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A value read from a row, with functions turned into their text. */
export type CellValue =
    string | number | boolean | bigint | symbol | Date | object | null | undefined;

const asCellValue = (value: unknown): CellValue =>
    typeof value === 'function' ? String(value) : (value as CellValue);

/**
 * Reads a dotted property path from a row, only through the row's own properties.
 * @param row The row.
 * @param path The dotted path, such as `address.city`.
 * @returns The value, or undefined when any segment is missing.
 */
export const valueAtPath = (
    row: Record<string, unknown>,
    path: string | undefined,
): CellValue => {
    if (!path) return undefined;
    let current: CellValue = row;
    for (const segment of path.split('.')) {
        if (current === null || typeof current !== 'object') return undefined;
        const record = current as Record<string, unknown>;
        if (!Object.hasOwn(record, segment)) return undefined;
        current = asCellValue(record[segment]);
    }
    return current;
};
