// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FilterDefinition, FilterValues, RangeValues } from './types';

/** Initialise the string/option selection map for all string/date filters. */
export function buildFilterValues(filters: FilterDefinition[] | undefined): FilterValues {
    const state: FilterValues = {};
    filters?.forEach((filter) => {
        if (!filter.type || filter.type === 'string' || filter.type === 'date') {
            state[filter.key] = new Set<string>();
        }
    });
    return state;
}

/** Initialise the numeric range map for all number filters. */
export function buildRangeValues(filters: FilterDefinition[] | undefined): RangeValues {
    const state: RangeValues = {};
    filters?.forEach((filter) => {
        if (filter.type === 'number') {
            state[filter.key] = null;
        }
    });
    return state;
}
