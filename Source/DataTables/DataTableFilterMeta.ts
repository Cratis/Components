// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Built-in match modes supported by Cratis data tables. */
export const DataTableFilterMatchMode = {
    StartsWith: 'startsWith',
    Contains: 'contains',
    NotContains: 'notContains',
    EndsWith: 'endsWith',
    Equals: 'equals',
    NotEquals: 'notEquals',
    In: 'in',
    Between: 'between',
    LessThan: 'lt',
    LessThanOrEqual: 'lte',
    GreaterThan: 'gt',
    GreaterThanOrEqual: 'gte',
    DateIs: 'dateIs',
    DateIsNot: 'dateIsNot',
    DateBefore: 'dateBefore',
    DateAfter: 'dateAfter',
} as const;

declare const customFilterMatchMode: unique symbol;

/** A custom match-mode name created through `registerDataTableFilterMatcher()`. */
export type DataTableCustomFilterMatchMode = string & {
    readonly [customFilterMatchMode]: true;
};

/**
 * Built-in or custom match-mode name.
 *
 * Arbitrary strings remain accepted for source compatibility with renderers
 * whose matcher was registered outside Components. New custom matchers should
 * use `registerDataTableFilterMatcher()`, which returns a branded name.
 */
export type DataTableFilterMatchMode =
    | (typeof DataTableFilterMatchMode)[keyof typeof DataTableFilterMatchMode]
    | DataTableCustomFilterMatchMode
    | (string & Record<never, never>);

/** Function used to match one row-field value against a filter value. */
export type DataTableFilterMatcher = (
    value: unknown,
    filter: unknown,
    locale?: string,
) => boolean;

/**
 * One field's filter constraint: the value to match and the Cratis-owned match mode.
 */
export interface DataTableFilterConstraint {
    /** The value to filter by. */
    value: unknown;
    /** How the value is compared. Defaults to {@link DataTableFilterMatchMode.Contains}. */
    matchMode?: DataTableFilterMatchMode;
}

/** Filter state for a Cratis data table, keyed by field name. */
export type DataTableFilterMeta = Record<string, DataTableFilterConstraint>;
