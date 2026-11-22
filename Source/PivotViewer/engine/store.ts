// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    PivotStore,
    Field,
    CategoricalIndex,
    NumericIndex,
    PivotIndexes,
    FilterSpec,
    FilterResult,
    GroupSpec,
    GroupResult,
    GroupingResult,
    FieldValue,
} from './types';

/**
 * Convert array of items to columnar store
 */
export function buildStore<TItem extends object>(
    items: TItem[],
    fieldExtractors: Map<string, (item: TItem) => FieldValue>,
): PivotStore {
    const count = items.length;
    const ids = new Uint32Array(count);
    const fields = new Map<string, Field>();

    for (let i = 0; i < count; i++) {
        ids[i] = i;
    }

    for (const [fieldName, extractor] of fieldExtractors) {
        fields.set(fieldName, buildField(items, extractor, count));
    }

    return { count, ids, fields, items };
}

function inferFieldKind<TItem extends object>(items: TItem[], extractor: (item: TItem) => FieldValue) {
    // Missing values do not determine a column's kind. Dates have already been
    // converted to timestamps by the field extractors, so they are numeric here.
    for (const item of items) {
        const value = extractor(item);
        if (value !== null && value !== undefined) return inferKind(value);
    }
    return inferKind(null);
}

function buildField<TItem extends object>(items: TItem[], extractor: (item: TItem) => FieldValue, count: number): Field {
    const kind = inferFieldKind(items, extractor);
    if (kind === 'number') return { kind, values: numberValues(items, extractor, count) };
    if (kind === 'boolean') return { kind, values: booleanValues(items, extractor, count) };
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
        values.push(stringifyValue(extractor(items[i])));
    }
    return { kind, values };
}

function numberValues<TItem>(items: TItem[], extractor: (item: TItem) => FieldValue, count: number) {
    const values = new Float64Array(count);
    for (let i = 0; i < count; i++) {
        const value = extractor(items[i]);
        values[i] = typeof value === 'number' ? value : NaN;
    }
    return values;
}

function booleanValues<TItem>(items: TItem[], extractor: (item: TItem) => FieldValue, count: number) {
    const values = new Uint8Array(count);
    for (let i = 0; i < count; i++) values[i] = encodeBoolean(extractor(items[i]));
    return values;
}

function encodeBoolean(value: FieldValue): number {
    if (value === null) return 2;
    if (value === undefined) return 3;
    return value === true ? 1 : 0;
}

function inferKind(value: FieldValue): 'string' | 'number' | 'boolean' {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
}

function stringifyValue(value: FieldValue): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    return String(value);
}

/**
 * Build categorical index for a string or boolean field
 */
export function buildCategoricalIndex(field: Field): CategoricalIndex {
    if (field.kind !== 'string' && field.kind !== 'boolean') {
        throw new Error('Categorical index requires string or boolean field');
    }

    const valueToIdsList = collectCategoricalIds(field);
    const valueToIds = new Map<string, Uint32Array>();
    const values: string[] = [];

    for (const [value, idsList] of valueToIdsList) {
        values.push(value);
        const ids = new Uint32Array(idsList.length);
        for (let i = 0; i < idsList.length; i++) {
            ids[i] = idsList[i];
        }
        ids.sort();
        valueToIds.set(value, ids);
    }

    values.sort();

    return { valueToIds, values };
}

function appendId(lists: Map<string, number[]>, value: string, id: number) {
    let list = lists.get(value);
    if (!list) {
        list = [];
        lists.set(value, list);
    }
    list.push(id);
}

function collectCategoricalIds(field: Exclude<Field, { kind: 'number' }>) {
    const lists = new Map<string, number[]>();
    for (let i = 0; i < field.values.length; i++) {
        const value = field.kind === 'boolean'
            ? ['false', 'true', 'null', 'undefined'][field.values[i]]
            : field.values[i];
        appendId(lists, value, i);
    }
    return lists;
}

/**
 * Build numeric index for a number field
 */
export function buildNumericIndex(field: Field): NumericIndex {
    if (field.kind !== 'number') {
        throw new Error('Numeric index requires number field');
    }

    const { pairs, min, max } = numericEntries(field.values);
    const values = new Float64Array(pairs.length);
    const ids = new Uint32Array(pairs.length);

    for (let i = 0; i < pairs.length; i++) {
        values[i] = pairs[i].value;
        ids[i] = pairs[i].id;
    }

    return { values, ids, min, max };
}

function numericEntries(values: Float64Array) {
    const pairs: Array<{ value: number; id: number }> = [];
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (!isNaN(value)) {
            pairs.push({ value, id: i });
            if (value < min) min = value;
            if (value > max) max = value;
        }
    }
    pairs.sort((a, b) => a.value - b.value);
    return { pairs, min, max };
}

/**
 * Build all indexes for specified fields
 */
export function buildIndexes(store: PivotStore, fieldNames: string[]): PivotIndexes {
    const categorical = new Map<string, CategoricalIndex>();
    const numeric = new Map<string, NumericIndex>();

    for (const fieldName of fieldNames) {
        const field = store.fields.get(fieldName);
        if (!field) continue;

        if (field.kind === 'string' || field.kind === 'boolean') {
            categorical.set(fieldName, buildCategoricalIndex(field));
        } else if (field.kind === 'number') {
            numeric.set(fieldName, buildNumericIndex(field));
        }
    }

    return { categorical, numeric };
}

/**
 * Intersect two sorted arrays of IDs
 */
function intersectSorted(a: Uint32Array, b: Uint32Array): Uint32Array {
    const result: number[] = [];
    let i = 0;
    let j = 0;

    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            result.push(a[i]);
            i++;
            j++;
        } else if (a[i] < b[j]) {
            i++;
        } else {
            j++;
        }
    }

    return new Uint32Array(result);
}

/**
 * Union multiple sorted arrays
 */
function unionSorted(arrays: Uint32Array[]): Uint32Array {
    if (arrays.length === 0) return new Uint32Array(0);
    if (arrays.length === 1) return arrays[0];

    const set = new Set<number>();
    for (const arr of arrays) {
        for (let i = 0; i < arr.length; i++) {
            set.add(arr[i]);
        }
    }

    const result = Array.from(set).sort((a, b) => a - b);
    return new Uint32Array(result);
}

/**
 * Apply filters using indexes
 */
export function applyFilters(
    store: PivotStore,
    indexes: PivotIndexes,
    filters: FilterSpec[],
): FilterResult {
    // Every active filter contributes exactly one set to intersect, even when it
    // matches nothing - an empty Uint32Array - so a zero-match filter correctly
    // collapses the overall intersection to empty instead of being skipped (which
    // would let the other active filters' matches leak through unfiltered).
    const sets = activeFilterSets(indexes, filters);
    if (sets.length === 0) {
        return {
            visibleIds: store.ids,
            count: store.count,
        };
    }

    const visibleIds = intersectAll(sets);
    return {
        visibleIds,
        count: visibleIds.length,
    };
}

function activeFilterSets(indexes: PivotIndexes, filters: FilterSpec[]) {
    const sets: Uint32Array[] = [];
    for (const filter of filters) {
        const ids = filterIds(indexes, filter);
        if (ids) sets.push(ids);
    }
    return sets;
}

function intersectAll(sets: Uint32Array[]) {
    let visibleIds = sets[0];
    for (let i = 1; i < sets.length; i++) {
        visibleIds = intersectSorted(visibleIds, sets[i]);
    }
    return visibleIds;
}

function filterIds(indexes: PivotIndexes, filter: FilterSpec): Uint32Array | undefined {
    if (filter.type === 'categorical') {
        const index = indexes.categorical.get(filter.field);
        return index ? categoricalFilterIds(index, filter.values) : undefined;
    }
    if (filter.type === 'numeric' && filter.range) {
        const index = indexes.numeric.get(filter.field);
        return index ? numericFilterIds(index, filter.range) : undefined;
    }
    return undefined;
}

function categoricalFilterIds(index: CategoricalIndex, values?: Set<string>): Uint32Array | undefined {
    if (!values || values.size === 0) return undefined;
    const arrays: Uint32Array[] = [];
    for (const value of values) {
        const ids = index.valueToIds.get(value);
        if (ids) arrays.push(ids);
    }
    return unionSorted(arrays);
}

function numericFilterIds(index: NumericIndex, range: { min: number; max: number }): Uint32Array {
    const result: number[] = [];
    for (let i = 0; i < index.values.length; i++) {
        const value = index.values[i];
        if (value >= range.min && value <= range.max) result.push(index.ids[i]);
    }
    result.sort((a, b) => a - b);
    return new Uint32Array(result);
}

/**
 * Group items by field value
 */
export function computeGrouping(
    store: PivotStore,
    indexes: PivotIndexes,
    visibleIds: Uint32Array,
    groupBy: GroupSpec,
): GroupingResult {
    const field = store.fields.get(groupBy.field);
    if (!field) {
        return { groups: [] };
    }

    if (field.kind === 'string' || field.kind === 'boolean') {
        return groupByCategorical(
            field,
            visibleIds,
            indexes.categorical.get(groupBy.field),
        );
    } else if (field.kind === 'number') {
        return groupByNumeric(field, visibleIds, groupBy.buckets);
    }

    return { groups: [] };
}

function groupByCategorical(
    field: Field,
    visibleIds: Uint32Array,
    index?: CategoricalIndex,
): GroupingResult {
    if (field.kind !== 'string' && field.kind !== 'boolean') {
        return { groups: [] };
    }

    const valueToIds = visibleCategoricalIds(field, visibleIds);
    const groups: GroupResult[] = [];
    const sortedValues = index ? index.values : Array.from(valueToIds.keys()).sort();

    for (const value of sortedValues) {
        const idsList = valueToIds.get(value);
        if (!idsList) continue;

        const ids = new Uint32Array(idsList);
        groups.push({
            key: value,
            label: value,
            value: field.kind === 'boolean' ? value === 'true' : value,
            ids,
            count: ids.length,
        });
    }

    return { groups };
}

function visibleCategoricalIds(field: Exclude<Field, { kind: 'number' }>, visibleIds: Uint32Array) {
    const lists = new Map<string, number[]>();
    for (let i = 0; i < visibleIds.length; i++) {
        const id = visibleIds[i];
        if (field.kind === 'boolean' && field.values[id] >= 2) continue;
        const value = field.kind === 'boolean' ? String(field.values[id] === 1) : field.values[id];
        appendId(lists, value, id);
    }
    return lists;
}

function groupByNumeric(
    field: Field,
    visibleIds: Uint32Array,
    buckets: number = 10,
): GroupingResult {
    if (field.kind !== 'number') {
        return { groups: [] };
    }

    const { min, max } = visibleNumericRange(field.values, visibleIds);
    if (!isFinite(min) || !isFinite(max)) return { groups: [] };

    // Avoid dividing by zero for a constant column; retain every non-NaN visible ID.
    if (min === max) {
        const ids = visibleIds.filter(id => !isNaN(field.values[id]));
        return { groups: [numericGroup('0', min, max, ids)] };
    }

    const bucketCount = Number.isFinite(buckets) ? Math.max(1, Math.floor(buckets)) : 10;
    const bucketSize = (max - min) / bucketCount;
    const bucketLists = bucketNumericIds(field.values, visibleIds, { min, bucketSize, bucketCount });
    return { groups: numericBucketGroups(bucketLists, min, bucketSize) };
}

function numericBucketGroups(bucketLists: number[][], min: number, bucketSize: number) {
    const groups: GroupResult[] = [];
    for (let i = 0; i < bucketLists.length; i++) {
        if (bucketLists[i].length === 0) continue;
        groups.push(numericGroup(`${i}`, min + i * bucketSize, min + (i + 1) * bucketSize,
            new Uint32Array(bucketLists[i])));
    }
    return groups;
}

function visibleNumericRange(values: Float64Array, ids: Uint32Array) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < ids.length; i++) {
        const value = values[ids[i]];
        // NaN compares false in both directions, leaving the range unchanged.
        if (value < min) min = value;
        if (value > max) max = value;
    }
    return { min, max };
}

function bucketNumericIds(
    values: Float64Array,
    ids: Uint32Array,
    range: { min: number; bucketSize: number; bucketCount: number },
) {
    const { min, bucketSize, bucketCount } = range;
    const lists: number[][] = Array.from({ length: bucketCount }, () => []);
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const value = values[id];
        if (isNaN(value)) continue;
        let bucketIndex = Math.floor((value - min) / bucketSize);
        if (bucketIndex >= bucketCount) bucketIndex = bucketCount - 1;
        if (bucketIndex < 0) bucketIndex = 0;
        lists[bucketIndex].push(id);
    }
    return lists;
}

function numericGroup(key: string, min: number, max: number, ids: Uint32Array): GroupResult {
    return { key, label: `${min.toFixed(1)} - ${max.toFixed(1)}`, value: min, ids, count: ids.length };
}

/**
 * Sort IDs based on a field
 */
export function sortIds(
    store: PivotStore,
    ids: Uint32Array,
    sortBy: string,
): Uint32Array {
    const field = store.fields.get(sortBy);
    if (!field) return ids;

    const sortedIds = new Uint32Array(ids);
    const comparator = idComparator(field);
    if (comparator) sortedIds.sort(comparator);
    return sortedIds;
}

function idComparator(field: Field): ((a: number, b: number) => number) | undefined {
    if (field.kind === 'number') {
        const values = field.values;
        return (a, b) => compareNumbers(values[a], values[b]);
    }
    if (field.kind === 'string') {
        const values = field.values;
        return (a, b) => values[a].localeCompare(values[b]);
    }
    if (field.kind === 'boolean') {
        const values = field.values;
        return (a, b) => values[a] - values[b];
    }
    return undefined;
}

function compareNumbers(a: number, b: number) {
    if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : 1;
    if (Number.isNaN(b)) return -1;
    return a - b;
}
