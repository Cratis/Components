// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type HTMLAttributes, type ReactNode } from 'react';
import { ToolbarDragContext } from './ToolbarDragContext';

/** Stable part attributes for {@link Toolbar}. */
export interface ToolbarParts {
    /** Toolbar root. */
    root?: HTMLAttributes<HTMLDivElement>;
}

/** Props for the {@link Toolbar} component. */
export interface ToolbarProps {
    /** The {@link ToolbarButton} elements to render inside this toolbar group. */
    children: ReactNode;
    /** Layout direction of the toolbar (default: 'vertical'). */
    orientation?: 'vertical' | 'horizontal';
    /** Extra class name for the toolbar root. */
    className?: string;
    /** Stable toolbar part attributes. */
    pt?: ToolbarParts;
    /**
     * When `true`, all {@link ToolbarButton} children become draggable by default.
     * Individual buttons can still override this with their own `draggable` prop.
     */
    draggable?: boolean;
    /**
     * Callback invoked when any child toolbar item starts being dragged.
     * Receives the item's associated data and the originating drag event.
     * Only fires for items that are actually draggable.
     */
    onItemDragStart?: (data: unknown, event: React.DragEvent) => void;
}

/**
 * A toolbar container that groups icon buttons with a rounded border,
 * mimicking the style of tools panels found in canvas-based applications.
 * Supports both vertical (default) and horizontal orientations.
 */
export const Toolbar = ({
    children,
    orientation = 'vertical',
    draggable = false,
    onItemDragStart,
    className,
    pt,
}: ToolbarProps) => (
    <ToolbarDragContext.Provider value={{ draggable, onItemDragStart }}>
        <div
            {...pt?.root}
            className={[
                'toolbar inline-flex',
                orientation === 'horizontal' ? 'flex-row' : 'flex-col',
                'items-center gap-1 p-2 rounded-2xl',
                pt?.root?.className,
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            data-cratis-part='root'
            data-orientation={orientation}
        >
            {children}
        </div>
    </ToolbarDragContext.Provider>
);
