// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';

export type PivotPrimitive = string | number | boolean | Date | null | undefined;

/**
 * Type-safe property accessor for accessing properties, including nested ones
 */
export type PropertyAccessor<TItem> = (item: TItem) => unknown;

/**
 * Extract property path from a property accessor function
 * Supports nested properties like item => item.address.city
 */
export function getPropertyPath<TItem>(accessor: PropertyAccessor<TItem>): string {
    const fnStr = accessor.toString();
    // Match patterns like: item => item.prop or item => item.prop.nested or (item) => item.prop
    const match = fnStr.match(/(?:=>|return)\s*[a-zA-Z_$][a-zA-Z0-9_$]*\.([a-zA-Z_$][a-zA-Z0-9_$.]*)/);
    return match ? match[1] : '';
}

/**
 * Get the value from an item using a property path string
 * Supports nested properties like "address.city"
 */
export function getValueByPath<TItem>(item: TItem, path: string): unknown {
    const parts = path.split('.');
    let value: unknown = item;
    for (const part of parts) {
        if (value === null || value === undefined) {
            return undefined;
        }
        value = value[part];
    }
    return value;
}

export interface PivotGroup<TItem extends object> {
  key: string;
  label: string;
  value: PivotPrimitive;
  items: TItem[];
  count?: number;
}

export interface PivotDimension<TItem extends object> {
  key: string;
  label: string;
  getValue: (item: TItem) => PivotPrimitive;
  formatValue?: (value: PivotPrimitive) => string;
  sort?: (a: PivotGroup<TItem>, b: PivotGroup<TItem>) => number;
}

export interface PivotFilterOption {
  key: string;
  label: string;
  value: PivotPrimitive;
  count: number;
}

export interface PivotFilter<TItem extends object> {
  key: string;
  label: string;
  getValue: (item: TItem) => PivotPrimitive;
  multi?: boolean;
  options?: PivotFilterOption[];
  sort?: (a: PivotFilterOption, b: PivotFilterOption) => number;
  /** For numeric filters, enables range picker with histogram */
  type?: 'string' | 'number' | 'date';
  /** Number of buckets for the histogram in range filters */
  buckets?: number;
}

export interface PivotViewerProps<TItem extends object> {
  data: TItem[];
  dimensions: PivotDimension<TItem>[];
  filters?: PivotFilter<TItem>[];
  defaultDimensionKey?: string;
  cardRenderer?: (item: TItem) => ReactNode;
  /** Optional renderer for the slide-in detail panel when a card is selected */
  detailRenderer?: (item: TItem, onClose: () => void) => ReactNode;
  getItemId?: (item: TItem, index: number) => string | number;
  searchFields?: PropertyAccessor<TItem>[];
  className?: string;
  emptyContent?: ReactNode;
  isLoading?: boolean;
  /**
   * Optional color overrides mapped to PrimeReact-like CSS variables.
   * If omitted, values are taken from the global theme (PrimeReact defaults).
   */
  colors?: Partial<{
    primaryColor: string;
    primaryColorText: string;
    primary500: string;
    surfaceGround: string;
    surfaceCard: string;
    surfaceSection: string;
    surfaceOverlay: string;
    surfaceBorder: string;
    textColor: string;
    textColorSecondary: string;
    highlightBg: string;
    maskbg: string;
    focusRing: string;
  }>;
}

export type FilterState = Record<string, Set<string>>;

export type RangeFilterState = Record<string, [number, number] | null>;
