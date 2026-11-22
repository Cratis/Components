// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes } from 'react';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

/** Stable part attributes for {@link ToolbarSeparator}. */
export interface ToolbarSeparatorParts {
    /** Native separator root. */
    root?: HTMLAttributes<HTMLDivElement>;
}

/** Props for the {@link ToolbarSeparator} component. */
export interface ToolbarSeparatorProps {
    /** Layout direction matching the parent {@link Toolbar} (default: 'vertical'). */
    orientation?: 'vertical' | 'horizontal';
    /** Stable separator attributes. */
    pt?: ToolbarSeparatorParts;
}

const toolbarSeparatorDescriptor = describeComponent<ToolbarSeparatorProps>('ToolbarSeparator', [
    { name: 'orientation', label: 'Orientation', type: 'enum', values: ['vertical', 'horizontal'] satisfies NonNullable<ToolbarSeparatorProps['orientation']>[], defaultValue: 'vertical' },
]);

/**
 * A visual divider for use inside a {@link Toolbar}.
 *
 * In a vertical toolbar (default) the separator renders as a horizontal rule.
 * In a horizontal toolbar it renders as a vertical rule.
 */
export const ToolbarSeparator = (props: ToolbarSeparatorProps) => {
    const [presentation, marker] = useComponentPresentation(toolbarSeparatorDescriptor, props);
    const { orientation = 'vertical', pt } = presentation;
    return (
        <div
            {...pt?.root}
            {...marker}
            role='separator'
            aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            className={`${orientation === 'horizontal' ? 'toolbar-separator toolbar-separator--in-horizontal' : 'toolbar-separator toolbar-separator--in-vertical'} ${pt?.root?.className ?? ''}`}
            data-cratis-part='toolbar-separator'
            data-orientation={orientation}
        />
    );
};
