// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import type {
  PivotDimension,
  PivotFilter,
  PivotFilterOption,
  PivotGroup,
  PivotPrimitive,
} from '../types';

export type FilterState = Record<string, Set<string>>;
export type RangeFilterState = Record<string, [number, number] | null>;

// Zoom configuration
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.05;
export const CARDS_PER_COLUMN = 5;
export const BASE_CARD_WIDTH = 180;
export const BASE_CARD_HEIGHT = 140;

export const toKey = (value: PivotPrimitive): string => {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' && Number.isNaN(value)) return 'nan';
  return String(value);
};

export const defaultFormat = (value: PivotPrimitive): string => {
  if (value === undefined) return 'Unknown';
  if (value === null) return 'None';
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

export const buildFilterState = <TItem extends object>(
  filters: PivotFilter<TItem>[] | undefined,
): FilterState => {
  const state: FilterState = {};
  filters?.forEach((filter) => {
    state[filter.key] = new Set<string>();
  });
  return state;
};

export const buildRangeFilterState = <TItem extends object>(
  filters: PivotFilter<TItem>[] | undefined,
): RangeFilterState => {
  const state: RangeFilterState = {};
  filters?.forEach((filter) => {
    if (filter.type === 'number') {
      state[filter.key] = null;
    }
  });
  return state;
};

export const applyFilters = <TItem extends object>(
  data: TItem[],
  filters: PivotFilter<TItem>[] | undefined,
  state: FilterState,
  rangeState: RangeFilterState,
  skipKey?: string,
): TItem[] => {
  if (!filters?.length) {
    return data;
  }

  // Pre-compute active filters to avoid checking empty Sets repeatedly
  const activeFilters: Array<{
    filter: PivotFilter<TItem>;
    selections?: Set<string>;
    range?: [number, number];
  }> = [];

  for (const filter of filters) {
    if (filter.key === skipKey) {
      continue;
    }

    if (filter.type === 'number') {
      const range = rangeState[filter.key];
      if (range) {
        activeFilters.push({ filter, range });
      }
    } else {
      const selections = state[filter.key];
      if (selections && selections.size > 0) {
        activeFilters.push({ filter, selections });
      }
    }
  }

  // Early exit if no active filters
  if (activeFilters.length === 0) {
    return data;
  }

  return data.filter((item) => {
    for (const { filter, selections, range } of activeFilters) {
      if (range) {
        const value = filter.getValue(item);
        const numValue = typeof value === 'number' ? value : Number(value);
        if (!Number.isNaN(numValue) && (numValue < range[0] || numValue > range[1])) {
          return false;
        }
      } else if (selections) {
        const valueKey = toKey(filter.getValue(item));
        if (!selections.has(valueKey)) {
          return false;
        }
      }
    }
    return true;
  });
};

export const computeFilterOptions = <TItem extends object>(
  data: TItem[],
  filter: PivotFilter<TItem>,
): PivotFilterOption[] => {
  if (filter.options?.length) {
    return filter.options;
  }

  const counts = new Map<string, { option: PivotFilterOption; count: number }>();

  data.forEach((item) => {
    const value = filter.getValue(item);
    const key = toKey(value);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        option: {
          key,
          label: defaultFormat(value),
          value,
          count: 1,
        },
        count: 1,
      });
    }
  });

  const options = Array.from(counts.values()).map(({ option, count }) => ({
    ...option,
    count,
  }));

  return filter.sort ? options.sort(filter.sort) : options.sort((a, b) => b.count - a.count);
};

export const renderOptionCount = (count: number | undefined): string | number =>
  typeof count === 'number' ? count : '';

export const computeNumericRange = <TItem extends object>(
  data: TItem[],
  filter: PivotFilter<TItem>,
): { min: number; max: number; values: PivotPrimitive[] } => {
  const values: PivotPrimitive[] = [];
  let min = Infinity;
  let max = -Infinity;

  data.forEach((item) => {
    const value = filter.getValue(item);
    values.push(value);
    const numValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isNaN(numValue)) {
      min = Math.min(min, numValue);
      max = Math.max(max, numValue);
    }
  });

  return {
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 100 : max,
    values,
  };
};

export const groupData = <TItem extends object>(
  data: TItem[],
  dimension: PivotDimension<TItem>,
): PivotGroup<TItem>[] => {
  const groups = new Map<string, PivotGroup<TItem>>();

  // Cache the formatValue function if it exists
  const formatValue = dimension.formatValue;

  data.forEach((item) => {
    const rawValue = dimension.getValue(item);
    const key = toKey(rawValue) || 'default';
    const group = groups.get(key);

    if (group) {
      group.items.push(item);
    } else {
      const label = formatValue ? formatValue(rawValue) : defaultFormat(rawValue);
      groups.set(key, {
        key,
        label,
        value: rawValue,
        items: [item],
      });
    }
  });

  const result = Array.from(groups.values());
  return dimension.sort ? result.sort(dimension.sort) : result.sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Reorder items for a CSS Grid that displays bottom-up, left-to-right.
 * CSS Grid fills top-to-bottom, left-to-right by default.
 *
 * Visual goal (items fill bottom row first, then row above, etc.):
 *   Grid Row 0 (top):    [4] [5] [6] [ ] [ ]   <- partial top row, empties on RIGHT
 *   Grid Row 1 (bottom): [0] [1] [2] [3] [4]   <- full bottom row
 *
 * Returns array with nulls for empty cells that need placeholder rendering.
 */
export const reorderForBottomUpGrid = <TItem,>(items: TItem[], columns: number): (TItem | null)[] => {
  if (items.length === 0) return [];

  const totalRows = Math.ceil(items.length / columns);
  const itemsInTopRow = items.length % columns || columns;

  const result: (TItem | null)[] = [];

  // Top row: items from the "overflow" portion, plus empty cells on the right
  const topRowStartIndex = items.length - itemsInTopRow;
  for (let col = 0; col < columns; col++) {
    if (col < itemsInTopRow) {
      result.push(items[topRowStartIndex + col]);
    } else {
      result.push(null); // Empty cell on right side of top row
    }
  }

  // Remaining rows (from second-to-top down to bottom)
  // These are full rows, containing items 0 to (items.length - itemsInTopRow - 1)
  for (let row = 1; row < totalRows; row++) {
    // This grid row corresponds to visual row (totalRows - 1 - row) from bottom
    // Visual row 0 = bottom, visual row (totalRows-1) = top
    const visualRowFromBottom = totalRows - 1 - row;
    const rowStartIndex = visualRowFromBottom * columns;

    for (let col = 0; col < columns; col++) {
      result.push(items[rowStartIndex + col]);
    }
  }

  return result;
};
