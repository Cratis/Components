// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext } from 'react';

/** Display mode for items inside a {@link ToolbarFolder}. */
export type ToolbarFolderMode = 'grid' | 'list';

/**
 * Internal context propagated from {@link ToolbarFolder} to its children.
 * Allows {@link ToolbarButton} to adapt its rendering to the folder's display mode.
 */
export const ToolbarFolderContext = createContext<ToolbarFolderMode>('grid');

/**
 * Returns the current {@link ToolbarFolderMode}.
 * Defaults to `'grid'` when used outside a {@link ToolbarFolder}.
 */
export const useToolbarFolderMode = (): ToolbarFolderMode => useContext(ToolbarFolderContext);
