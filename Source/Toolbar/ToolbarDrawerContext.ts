// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext } from 'react';

/**
 * Internal context a drawer {@link ToolbarFolder} provides to the tiles inside it. Its presence is
 * what makes a {@link ToolbarButton} render as a labeled tile instead of an icon-only cell.
 */
export interface ToolbarDrawerContextValue {
    /** Reports that a tile drag started or ended, so the drawer can reflect the drag lifecycle. */
    setDragging: (dragging: boolean) => void;
}

/** Context provided by a drawer {@link ToolbarFolder}; `null` everywhere else. */
export const ToolbarDrawerContext = createContext<ToolbarDrawerContextValue | null>(null);

/** Returns the enclosing drawer, or `null` when the caller is not inside a drawer folder. */
export const useToolbarDrawer = (): ToolbarDrawerContextValue | null => useContext(ToolbarDrawerContext);
