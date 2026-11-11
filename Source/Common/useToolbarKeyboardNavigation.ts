// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, type KeyboardEvent } from 'react';
import { ToolbarFocusMode } from './ToolbarFocusMode';
import { resolveDirection, resolveKeyTool, shouldIgnoreKey } from './toolbarFocusQueries';
import { candidatesFor, focusFirstFocusable } from './toolbarNavigationCandidates';
import { availableTools } from './toolbarTabStop';
import { useToolbarTabStop } from './useToolbarTabStop';

type Orientation = 'horizontal' | 'vertical';

/** Components-owned toolbar focus behavior; never captures keys from child widgets. */
export const useToolbarKeyboardNavigation = (orientation: Orientation, focusMode: ToolbarFocusMode) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const { state, roving } = useToolbarTabStop(rootRef, focusMode === ToolbarFocusMode.SingleTabStop);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (shouldIgnoreKey(event, focusMode)) return;
        const root = rootRef.current;
        const current = resolveKeyTool(root, event.target);
        if (!root || !current) return;
        const candidates = candidatesFor(event.key, orientation, resolveDirection(root), availableTools(root, state), current);
        if (focusFirstFocusable(candidates, current)) event.preventDefault();
    };

    return { rootRef, onKeyDown, roving };
};
