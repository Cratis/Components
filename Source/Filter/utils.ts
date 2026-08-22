// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FilterDefinition, FilterValues, HistogramBucket, RangeValues } from './types';

/** A histogram bucket with the tallest count in its set, so a bar can size itself. */
export interface RenderedHistogramBucket extends HistogramBucket {
    maxCount: number;
}

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

/**
 * Build the bars a range filter renders.
 *
 * Pre-counted buckets are rendered as given - they come from a source that saw more data than the
 * browser holds, so recounting them against the loaded values would understate the real totals.
 * Otherwise the raw values are counted into `bucketCount` evenly sized buckets across the range.
 */
export function buildHistogram(
    values: number[],
    min: number,
    max: number,
    bucketCount: number,
    provided?: HistogramBucket[]
): RenderedHistogramBucket[] {
    if (provided !== undefined) {
        if (provided.length === 0) return [];
        const providedMax = Math.max(...provided.map((bucket) => bucket.count), 1);
        return provided.map((bucket) => ({ ...bucket, maxCount: providedMax }));
    }

    const range = max - min;
    if (range <= 0 || values.length === 0) return [];

    const bucketSize = range / bucketCount;
    const counts: number[] = Array(bucketCount).fill(0);

    values.forEach((value) => {
        const index = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
        if (index >= 0 && index < bucketCount) counts[index]++;
    });

    const maxCount = Math.max(...counts, 1);

    return counts.map((count, index) => ({
        start: min + index * bucketSize,
        end: min + (index + 1) * bucketSize,
        count,
        maxCount,
    }));
}
