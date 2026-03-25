// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext } from 'react';

/** Internal context shared from {@link Toolbar} to its children for drag-and-drop wiring. */
export interface ToolbarDragContextValue {
    /** Whether all buttons inside this toolbar are draggable by default. */
    draggable: boolean;
    /**
     * Callback invoked when any child toolbar item starts being dragged.
     * Receives the item's associated data and the originating drag event.
     */
    onItemDragStart?: (data: unknown, event: React.DragEvent) => void;
}

/**
 * React context that propagates drag-and-drop settings from a {@link Toolbar}
 * down to its child {@link ToolbarButton} components without requiring explicit prop
 * threading through intermediate wrappers such as {@link ToolbarSection}.
 */
export const ToolbarDragContext = createContext<ToolbarDragContextValue>({
    draggable: false,
});

/**
 * Returns the nearest {@link ToolbarDragContext} value.
 * When no provider is present (i.e. the button is used outside a Toolbar),
 * the default value with {@link ToolbarDragContextValue.draggable} set to `false` is returned.
 */
export const useToolbarDragContext = (): ToolbarDragContextValue => useContext(ToolbarDragContext);
