// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { FilterPanel, type FilterPanelProps } from './FilterPanel';

export type FilterPanelContainerProps<TItem extends object> = FilterPanelProps<TItem>;

export function FilterPanelContainer<TItem extends object>(props: FilterPanelContainerProps<TItem>) {
  return <FilterPanel {...props} />;
}
