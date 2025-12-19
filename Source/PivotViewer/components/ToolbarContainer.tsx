import { Toolbar, type ToolbarProps } from './Toolbar';

export type ToolbarContainerProps<TItem extends object> = ToolbarProps<TItem>;

export function ToolbarContainer<TItem extends object>(props: ToolbarContainerProps<TItem>) {
  return <Toolbar {...props} />;
}
