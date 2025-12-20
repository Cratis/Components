// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Toolbar, type ToolbarProps } from './Toolbar';

export type ToolbarContainerProps<TItem extends object> = ToolbarProps<TItem>;

export function ToolbarContainer<TItem extends object>(props: ToolbarContainerProps<TItem>) {
  return <Toolbar {...props} />;
}
