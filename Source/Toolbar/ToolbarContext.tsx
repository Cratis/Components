// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FC, ReactNode } from 'react';

/** Props for the {@link ToolbarContext} component. */
export interface ToolbarContextProps {
    /** Unique name identifying this context within a {@link ToolbarSection}. */
    name: string;
    /** The toolbar items to render when this context is active. */
    children: ReactNode;
}

/**
 * Defines a named context (a set of toolbar items) within a {@link ToolbarSection}.
 * The section renders only the active context at a time and animates between them.
 *
 * This is a data-only component; its rendering is fully managed by {@link ToolbarSection}.
 */
export const ToolbarContext: FC<ToolbarContextProps> = () => null;
