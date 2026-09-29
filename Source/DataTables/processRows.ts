// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DataTableRowProcessing } from './DataTableRowProcessing';
import { matchesFilterEntry } from './matchesFilterEntry';
import type { ProcessedRow } from './ProcessedRow';
import type { RowProcessingState } from './RowProcessingState';
import { valueAtPath } from './valueAtPath';

const compareValues = (left: unknown, right: unknown): number => {
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    if (left instanceof Date && right instanceof Date)
        return left.getTime() - right.getTime();
    return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
    });
};

/**
 * Filters and sorts loaded rows by the table's state, or keeps them as given when row processing is off.
 * @param data The loaded rows.
 * @param state The filter, search and sort state.
 * @returns The rows to render, each with its loaded-page index.
 */
export const processRows = <TData extends object>(
    data: TData[],
    {
        filters,
        globalFilter,
        globalFilterFields,
        sort,
        rowProcessing,
    }: RowProcessingState,
): ProcessedRow<TData>[] => {
    if (rowProcessing === DataTableRowProcessing.None) {
        return data.map((row, loadedIndex) => ({ row, loadedIndex }));
    }
    const term = globalFilter.trim().toLocaleLowerCase();
    const rows = data
        .map((row, loadedIndex) => ({ row, loadedIndex }))
        .filter(({ row }) => {
            const rowValues = row as Record<string, unknown>;
            const matchesColumns = Object.entries(filters).every(([field, entry]) =>
                matchesFilterEntry(valueAtPath(rowValues, field), entry),
            );
            if (!matchesColumns) return false;
            if (!term || !globalFilterFields?.length) return true;
            return globalFilterFields.some((field) =>
                String(valueAtPath(rowValues, field) ?? '')
                    .toLocaleLowerCase()
                    .includes(term),
            );
        });

    if (!sort) return rows;
    return [...rows].sort((left, right) => {
        const comparison = compareValues(
            valueAtPath(left.row as Record<string, unknown>, sort.field),
            valueAtPath(right.row as Record<string, unknown>, sort.field),
        );
        return sort.direction === 'ascending' ? comparison : -comparison;
    });
};
