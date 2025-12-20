// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import type { ReactNode } from 'react';

export type PivotPrimitive = string | number | boolean | Date | null | undefined;

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
  getItemId?: (item: TItem, index: number) => string | number;
  searchFields?: (keyof TItem)[];
  className?: string;
  emptyContent?: ReactNode;
  isLoading?: boolean;
}
