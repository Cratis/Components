// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Props for the {@link ToolbarSeparator} component. */
export interface ToolbarSeparatorProps {
    /** Layout direction matching the parent {@link Toolbar} (default: 'vertical'). */
    orientation?: 'vertical' | 'horizontal';
}

/**
 * A visual divider for use inside a {@link Toolbar}.
 *
 * In a vertical toolbar (default) the separator renders as a horizontal rule.
 * In a horizontal toolbar it renders as a vertical rule.
 */
export const ToolbarSeparator = ({ orientation = 'vertical' }: ToolbarSeparatorProps) => (
    <div
        role='separator'
        aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        className={orientation === 'horizontal' ? 'toolbar-separator toolbar-separator--in-horizontal' : 'toolbar-separator toolbar-separator--in-vertical'}
    />
);
