// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    DataTableFilterMatchMode,
    type DataTableFilterConstraint,
    type DataTableFilterEntry,
} from './DataTableFilterMeta';
import { resolveDataTableFilterMatcher } from './DataTableFilterMatcherRegistry';

const dateNumber = (value: unknown) => {
    // A cloned Date is normalized in place so caller-owned Date instances (row
    // values and filter constraints alike) are never mutated by comparison.
    const date =
        value instanceof Date ? new Date(value.getTime()) : new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date.setHours(0, 0, 0, 0);
};

/**
 * The first constraint of a filter entry, which is what the column filter menu edits.
 * @param entry The filter entry, if any.
 * @returns Its first constraint, or undefined.
 */
export const firstConstraint = (
    entry: DataTableFilterEntry | undefined,
): DataTableFilterConstraint | undefined =>
    entry && 'constraints' in entry ? entry.constraints[0] : entry;

const builtInMatches = (
    value: unknown,
    constraint: DataTableFilterConstraint,
): boolean => {
    const filter = constraint.value;
    const mode = constraint.matchMode ?? DataTableFilterMatchMode.Contains;
    if (filter === null || filter === undefined || filter === '') return true;

    const valueText = String(value ?? '').toLocaleLowerCase();
    const filterText = String(filter).toLocaleLowerCase();
    const valueNumber = typeof value === 'number' ? value : Number(value);
    const filterNumber = typeof filter === 'number' ? filter : Number(filter);

    switch (mode) {
        case DataTableFilterMatchMode.StartsWith:
            return valueText.startsWith(filterText);
        case DataTableFilterMatchMode.Contains:
            return valueText.includes(filterText);
        case DataTableFilterMatchMode.NotContains:
            return !valueText.includes(filterText);
        case DataTableFilterMatchMode.EndsWith:
            return valueText.endsWith(filterText);
        case DataTableFilterMatchMode.Equals:
            return Object.is(value, filter) || valueText === filterText;
        case DataTableFilterMatchMode.NotEquals:
            return !(Object.is(value, filter) || valueText === filterText);
        case DataTableFilterMatchMode.In:
            return Array.isArray(filter) && filter.some((item) => Object.is(item, value));
        case DataTableFilterMatchMode.Between:
            return (
                Array.isArray(filter) &&
                filter.length >= 2 &&
                valueNumber >= Number(filter[0]) &&
                valueNumber <= Number(filter[1])
            );
        case DataTableFilterMatchMode.LessThan:
            return valueNumber < filterNumber;
        case DataTableFilterMatchMode.LessThanOrEqual:
            return valueNumber <= filterNumber;
        case DataTableFilterMatchMode.GreaterThan:
            return valueNumber > filterNumber;
        case DataTableFilterMatchMode.GreaterThanOrEqual:
            return valueNumber >= filterNumber;
        case DataTableFilterMatchMode.DateIs:
            return dateNumber(value) === dateNumber(filter);
        case DataTableFilterMatchMode.DateIsNot:
            return dateNumber(value) !== dateNumber(filter);
        case DataTableFilterMatchMode.DateBefore:
            return (dateNumber(value) ?? Infinity) < (dateNumber(filter) ?? -Infinity);
        case DataTableFilterMatchMode.DateAfter:
            return (dateNumber(value) ?? -Infinity) > (dateNumber(filter) ?? Infinity);
        default:
            return resolveDataTableFilterMatcher(String(mode))?.(value, filter) ?? false;
    }
};

/**
 * Whether a value satisfies a filter entry, combining its constraints with the entry's operator.
 * @param value The row value.
 * @param entry The filter entry.
 * @returns True when the value matches.
 */
export const matchesFilterEntry = (value: unknown, entry: DataTableFilterEntry) => {
    if (!('constraints' in entry)) return builtInMatches(value, entry);
    if (entry.constraints.length === 0) return true;

    const matches = entry.constraints.map((constraint) =>
        builtInMatches(value, constraint),
    );
    return entry.operator?.toLowerCase() === 'or'
        ? matches.some(Boolean)
        : matches.every(Boolean);
};
