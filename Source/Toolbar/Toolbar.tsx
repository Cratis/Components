// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode } from 'react';
import './Toolbar.css';

/** Props for the {@link Toolbar} component. */
export interface ToolbarProps {
    /** The {@link ToolbarButton} elements to render inside this toolbar group. */
    children: ReactNode;
    /** Layout direction of the toolbar (default: 'vertical'). */
    orientation?: 'vertical' | 'horizontal';
}

/**
 * A toolbar container that groups icon buttons with a rounded border,
 * mimicking the style of tools panels found in canvas-based applications.
 * Supports both vertical (default) and horizontal orientations.
 */
export const Toolbar = ({ children, orientation = 'vertical' }: ToolbarProps) => (
    <div
        className={`toolbar inline-flex ${
            orientation === 'horizontal' ? 'flex-row' : 'flex-col'
        } items-center gap-1 p-2 rounded-2xl`}
    >
        {children}
    </div>
);
