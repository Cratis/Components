/**
 * Build columnar store from array of objects
 */

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
  fieldExtractors: Map<string, (item: TItem) => FieldValue>
): PivotStore {
  const count = items.length;
  const ids = new Uint32Array(count);
  const fields = new Map<string, Field>();

  for (let i = 0; i < count; i++) {
    ids[i] = i;
  }

  for (const [fieldName, extractor] of fieldExtractors) {
    const firstValue = count > 0 ? extractor(items[0]) : null;
    const kind = inferKind(firstValue);

    if (kind === 'number') {
      const values = new Float64Array(count);
      for (let i = 0; i < count; i++) {
        const val = extractor(items[i]);
        values[i] = typeof val === 'number' ? val : NaN;
      }
      fields.set(fieldName, { kind: 'number', values });
    } else if (kind === 'boolean') {
      const values = new Uint8Array(count);
      for (let i = 0; i < count; i++) {
        const val = extractor(items[i]);
        values[i] = val === true ? 1 : 0;
      }
      fields.set(fieldName, { kind: 'boolean', values });
    } else {
      const values: string[] = [];
      for (let i = 0; i < count; i++) {
        const val = extractor(items[i]);
        values.push(stringifyValue(val));
      }
      fields.set(fieldName, { kind: 'string', values });
    }
  }

  return { count, ids, fields, items };
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
 * Build categorical index for a string field
 */
export function buildCategoricalIndex(field: Field): CategoricalIndex {
  if (field.kind !== 'string') {
    throw new Error('Categorical index requires string field');
  }

  const valueToIdsList = new Map<string, number[]>();

  for (let i = 0; i < field.values.length; i++) {
    const value = field.values[i];
    let list = valueToIdsList.get(value);
    if (!list) {
      list = [];
      valueToIdsList.set(value, list);
    }
    list.push(i);
  }

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

/**
 * Build numeric index for a number field
 */
export function buildNumericIndex(field: Field): NumericIndex {
  if (field.kind !== 'number') {
    throw new Error('Numeric index requires number field');
  }

  const count = field.values.length;
  const pairs: Array<{ value: number; id: number }> = [];

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < count; i++) {
    const value = field.values[i];
    if (!isNaN(value)) {
      pairs.push({ value, id: i });
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  pairs.sort((a, b) => a.value - b.value);

  const values = new Float64Array(pairs.length);
  const ids = new Uint32Array(pairs.length);

  for (let i = 0; i < pairs.length; i++) {
    values[i] = pairs[i].value;
    ids[i] = pairs[i].id;
  }

  return { values, ids, min, max };
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

    if (field.kind === 'string') {
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
  filters: FilterSpec[]
): FilterResult {
  if (filters.length === 0) {
    return {
      visibleIds: store.ids,
      count: store.count,
    };
  }

  const sets: Uint32Array[] = [];

  for (const filter of filters) {
    if (filter.type === 'categorical' && filter.values && filter.values.size > 0) {
      const index = indexes.categorical.get(filter.field);
      if (!index) continue;

      const arrays: Uint32Array[] = [];
      for (const value of filter.values) {
        const ids = index.valueToIds.get(value);
        if (ids) {
          arrays.push(ids);
        }
      }

      if (arrays.length > 0) {
        sets.push(unionSorted(arrays));
      }
    } else if (filter.type === 'numeric' && filter.range) {
      const index = indexes.numeric.get(filter.field);
      if (!index) continue;

      const { min, max } = filter.range;
      const result: number[] = [];

      for (let i = 0; i < index.values.length; i++) {
        const val = index.values[i];
        if (val >= min && val <= max) {
          result.push(index.ids[i]);
        }
      }

      if (result.length > 0) {
        result.sort((a, b) => a - b);
        sets.push(new Uint32Array(result));
      }
    }
  }

  if (sets.length === 0) {
    return {
      visibleIds: store.ids,
      count: store.count,
    };
  }

  let visibleIds = sets[0];
  for (let i = 1; i < sets.length; i++) {
    visibleIds = intersectSorted(visibleIds, sets[i]);
  }

  return {
    visibleIds,
    count: visibleIds.length,
  };
}

/**
 * Group items by field value
 */
export function computeGrouping(
  store: PivotStore,
  indexes: PivotIndexes,
  visibleIds: Uint32Array,
  groupBy: GroupSpec
): GroupingResult {
  const field = store.fields.get(groupBy.field);
  if (!field) {
    return { groups: [] };
  }

  if (field.kind === 'string') {
    return groupByCategorical(field, visibleIds, indexes.categorical.get(groupBy.field));
  } else if (field.kind === 'number') {
    return groupByNumeric(field, visibleIds, groupBy.buckets);
  }

  return { groups: [] };
}

function groupByCategorical(
  field: Field,
  visibleIds: Uint32Array,
  index?: CategoricalIndex
): GroupingResult {
  if (field.kind !== 'string') {
    return { groups: [] };
  }

  const valueToIds = new Map<string, number[]>();

  for (let i = 0; i < visibleIds.length; i++) {
    const id = visibleIds[i];
    const value = field.values[id];

    let list = valueToIds.get(value);
    if (!list) {
      list = [];
      valueToIds.set(value, list);
    }
    list.push(id);
  }

  const groups: GroupResult[] = [];
  const sortedValues = index ? index.values : Array.from(valueToIds.keys()).sort();

  for (const value of sortedValues) {
    const idsList = valueToIds.get(value);
    if (!idsList) continue;

    const ids = new Uint32Array(idsList);
    groups.push({
      key: value,
      label: value,
      value,
      ids,
      count: ids.length,
    });
  }

  return { groups };
}

function groupByNumeric(
  field: Field,
  visibleIds: Uint32Array,
  buckets: number = 10
): GroupingResult {
  if (field.kind !== 'number') {
    return { groups: [] };
  }

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < visibleIds.length; i++) {
    const value = field.values[visibleIds[i]];
    if (!isNaN(value)) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  if (!isFinite(min) || !isFinite(max)) {
    return { groups: [] };
  }

  const range = max - min;
  const bucketSize = range / buckets;

  const bucketLists: number[][] = Array.from({ length: buckets }, () => []);

  for (let i = 0; i < visibleIds.length; i++) {
    const id = visibleIds[i];
    const value = field.values[id];
    if (isNaN(value)) continue;

    let bucketIndex = Math.floor((value - min) / bucketSize);
    if (bucketIndex >= buckets) bucketIndex = buckets - 1;

    bucketLists[bucketIndex].push(id);
  }

  const groups: GroupResult[] = [];

  for (let i = 0; i < buckets; i++) {
    const list = bucketLists[i];
    if (list.length === 0) continue;

    const bucketMin = min + i * bucketSize;
    const bucketMax = min + (i + 1) * bucketSize;

    const ids = new Uint32Array(list);
    groups.push({
      key: `${i}`,
      label: `${bucketMin.toFixed(1)} - ${bucketMax.toFixed(1)}`,
      value: bucketMin,
      ids,
      count: ids.length,
    });
  }

  return { groups };
}

/**
 * Sort IDs based on a field
 */
export function sortIds(
  store: PivotStore,
  ids: Uint32Array,
  sortBy: string
): Uint32Array {
  const field = store.fields.get(sortBy);
  if (!field) return ids;

  const sortedIds = new Uint32Array(ids);

  if (field.kind === 'number') {
    const values = field.values;
    sortedIds.sort((a, b) => values[a] - values[b]);
  } else if (field.kind === 'string') {
    const values = field.values;
    sortedIds.sort((a, b) => values[a].localeCompare(values[b]));
  } else if (field.kind === 'boolean') {
    const values = field.values;
    sortedIds.sort((a, b) => values[a] - values[b]);
  }

  return sortedIds;
}
