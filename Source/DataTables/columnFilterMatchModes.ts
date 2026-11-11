// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    DataTableFilterMatchMode,
    type DataTableFilterMatchMode as FilterMatchMode,
} from './DataTableFilterMeta';
import type { ColumnFilterDataType, ColumnFilterMenuLabels } from './ColumnFilterMenu';

export interface MatchModeOption {
    label: string;
    value: FilterMatchMode;
}

const modeOptions = (pairs: [string, FilterMatchMode][]): MatchModeOption[] =>
    pairs.map(([label, value]) => ({ label, value }));

// A column that filters over a known set of values has only two questions worth asking of it - is it
// this one, or is it not - so the free-text and numeric comparisons are not offered for it.
const valueMatchModeOptions: MatchModeOption[] = modeOptions([
    ['Equals', DataTableFilterMatchMode.Equals],
    ['Not equals', DataTableFilterMatchMode.NotEquals],
]);

const matchModesByDataType: Record<ColumnFilterDataType, MatchModeOption[]> = {
    numeric: modeOptions([
        ['Equals', DataTableFilterMatchMode.Equals],
        ['Not equals', DataTableFilterMatchMode.NotEquals],
        ['Less than', DataTableFilterMatchMode.LessThan],
        ['Less than or equal', DataTableFilterMatchMode.LessThanOrEqual],
        ['Greater than', DataTableFilterMatchMode.GreaterThan],
        ['Greater than or equal', DataTableFilterMatchMode.GreaterThanOrEqual],
    ]),
    date: modeOptions([
        ['Date is', DataTableFilterMatchMode.DateIs],
        ['Date is not', DataTableFilterMatchMode.DateIsNot],
        ['Before', DataTableFilterMatchMode.DateBefore],
        ['After', DataTableFilterMatchMode.DateAfter],
    ]),
    boolean: modeOptions([['Equals', DataTableFilterMatchMode.Equals]]),
    text: modeOptions([
        ['Contains', DataTableFilterMatchMode.Contains],
        ['Starts with', DataTableFilterMatchMode.StartsWith],
        ['Ends with', DataTableFilterMatchMode.EndsWith],
        ['Equals', DataTableFilterMatchMode.Equals],
        ['Not contains', DataTableFilterMatchMode.NotContains],
        ['Not equals', DataTableFilterMatchMode.NotEquals],
    ]),
};

const defaultModesByDataType: Record<ColumnFilterDataType, FilterMatchMode> = {
    text: DataTableFilterMatchMode.Contains,
    date: DataTableFilterMatchMode.DateIs,
    numeric: DataTableFilterMatchMode.Equals,
    boolean: DataTableFilterMatchMode.Equals,
};

export const defaultModeFor = (dataType: ColumnFilterDataType): FilterMatchMode =>
    defaultModesByDataType[dataType] ?? DataTableFilterMatchMode.Equals;

const offeredModes = (dataType: ColumnFilterDataType, hasKnownValues: boolean): MatchModeOption[] =>
    hasKnownValues ? valueMatchModeOptions : (matchModesByDataType[dataType] ?? matchModesByDataType.text);

/** The localized match modes on offer, with the current draft mode appended when it is not one of them. */
export const buildModeOptions = (
    dataType: ColumnFilterDataType,
    hasKnownValues: boolean,
    draftMode: FilterMatchMode,
    matchModeLabel: ColumnFilterMenuLabels['matchModeLabel'],
): MatchModeOption[] => {
    const options = offeredModes(dataType, hasKnownValues).map(option => ({
        ...option,
        label: matchModeLabel(option.value, option.label),
    }));
    return options.some(option => option.value === draftMode)
        ? options
        : [...options, { label: matchModeLabel(draftMode, String(draftMode)), value: draftMode }];
};
