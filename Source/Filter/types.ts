// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';

export type FilterValue = string | number | boolean | Date | null | undefined;

export interface FilterOption {
  key: string;
  label: string;
  value: FilterValue;
  count?: number;
}

export interface FilterEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
}

export interface FilterDefinition {
  key: string;
  label: string;
  /** Filter type. Defaults to 'string'. Use 'number' for range/histogram. Use 'custom' with renderEditor for fully custom UI. */
  type?: 'string' | 'number' | 'date' | 'custom';
  /** Allow selecting multiple options (checkbox behaviour). Defaults to false (radio behaviour). */
  multi?: boolean;
  /** Pre-computed options for string/date filters. */
  options?: FilterOption[];
  /** Numeric range data for 'number' type filters. */
  numericRange?: { min: number; max: number; values: FilterValue[] };
  /** Number of histogram buckets. Defaults to 20. */
  buckets?: number;
  /** Custom editor renderer. Used for 'custom' type, or to override any other type. */
  renderEditor?: (props: FilterEditorProps) => ReactNode;
}

/** Selected string/option values for each filter, keyed by FilterDefinition.key. */
export type FilterValues = Record<string, Set<string>>;

/** Selected numeric ranges for each filter, keyed by FilterDefinition.key. */
export type RangeValues = Record<string, [number, number] | null>;

/** Custom values for filters that use renderEditor, keyed by FilterDefinition.key. */
export type CustomFilterValues = Record<string, unknown>;
