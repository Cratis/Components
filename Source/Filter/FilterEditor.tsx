// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { FilterEditorProps } from './types';

export interface FilterEditorSlotProps {
  /** Must match the `key` of the corresponding `FilterDefinition`. */
  filterKey: string;
  /** Render prop that receives `{ value, onChange }` and returns the editor UI. */
  children: (props: FilterEditorProps) => ReactNode;
}

/**
 * Declares a custom editor for a specific filter group inside `<FilterPanel>`.
 *
 * Place one or more `<FilterEditor>` elements as children of `<FilterPanel>`.
 * The panel will slot each editor into the filter group whose key matches
 * the `filterKey` prop.
 *
 * ```tsx
 * <FilterPanel filters={filters} {...stateProps}>
 *   <FilterEditor filterKey="rating">
 *     {({ value, onChange }) => <MyRatingPicker value={value} onChange={onChange} />}
 *   </FilterEditor>
 * </FilterPanel>
 * ```
 *
 * This component renders nothing itself — it is only used as a slot descriptor
 * by `FilterPanel`.
 */
export function FilterEditor(_props: FilterEditorSlotProps): null {
  return null;
}
