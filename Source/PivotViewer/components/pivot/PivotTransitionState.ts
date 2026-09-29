// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import type { GroupingResult, ItemId, LayoutResult } from '../../engine/types';
import type { ViewMode } from '../Toolbar';

/** What a PivotCanvas remembers between renders to animate view, grouping and layout changes. */
export interface PivotTransitionState {
    isAnimatingRef: RefObject<boolean>;
    isViewTransitionRef: RefObject<boolean>;
    lastViewChangeTimeRef: RefObject<number>;
    previousViewModeRef: RefObject<ViewMode>;
    prevLayoutRef: RefObject<LayoutResult | null>;
    transitionLayoutRef: RefObject<LayoutResult | null>;
    transitionSeenIdsRef: RefObject<Set<ItemId>>;
    prevGroupingRef: RefObject<GroupingResult | null>;
    prevScrollTopRef: RefObject<number>;
    prevScrollLeftRef: RefObject<number>;
    prevPanRef: RefObject<{ x: number; y: number }>;
}
