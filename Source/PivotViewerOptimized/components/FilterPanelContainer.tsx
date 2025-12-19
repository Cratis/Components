import { FilterPanel, type FilterPanelProps } from './FilterPanel';

export type FilterPanelContainerProps<TItem extends object> = FilterPanelProps<TItem>;

export function FilterPanelContainer<TItem extends object>(props: FilterPanelContainerProps<TItem>) {
  return <FilterPanel {...props} />;
}
