// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef } from 'react';
import type { GroupingResult, ItemId, LayoutResult } from '../../engine/types';
import type { ViewMode } from '../Toolbar';
import type { PivotTransitionState } from './PivotTransitionState';

/**
 * The refs a PivotCanvas keeps between renders to animate view, grouping and layout changes.
 * @param viewMode The initial view mode.
 * @param pan The initial pan.
 * @returns The transition state.
 */
export const usePivotTransitionState = (
    viewMode: ViewMode,
    pan: { x: number; y: number },
): PivotTransitionState => {
    const isAnimatingRef = useRef(false);
    const isViewTransitionRef = useRef(false);
    const lastViewChangeTimeRef = useRef(0);
    const previousViewModeRef = useRef<ViewMode>(viewMode);
    const prevLayoutRef = useRef<LayoutResult | null>(null);
    const transitionLayoutRef = useRef<LayoutResult | null>(null);
    const transitionSeenIdsRef = useRef<Set<ItemId>>(new Set());
    const prevGroupingRef = useRef<GroupingResult | null>(null);
    const prevScrollTopRef = useRef<number>(0);
    const prevScrollLeftRef = useRef<number>(0);
    const prevPanRef = useRef(pan);
    return {
        isAnimatingRef,
        isViewTransitionRef,
        lastViewChangeTimeRef,
        previousViewModeRef,
        prevLayoutRef,
        transitionLayoutRef,
        transitionSeenIdsRef,
        prevGroupingRef,
        prevScrollTopRef,
        prevScrollLeftRef,
        prevPanRef,
    };
};
