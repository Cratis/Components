// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback } from 'react';
import type { RefObject } from 'react';
import { resolveInternalItemIndex } from '../utils/idResolution';
import { useCardSelection } from './useCardSelection';
import { useDetailPanelClose } from './useDetailPanelClose';
import { useScrollSync } from './useScrollSync';
import { useAnimationModeTracking } from './useAnimationModeTracking';
import { useViewModeScrollHandling } from './useViewModeScrollHandling';

type CardSelectionParams<TItem extends object> = Parameters<typeof useCardSelection<TItem>>[0];
type AnimationTrackingParams = Parameters<typeof useAnimationModeTracking>;

export interface UsePivotViewerInteractionsOptions<TItem extends object>
    extends Omit<CardSelectionParams<TItem>, 'resolveId' | 'containerRef'> {
    containerRef: RefObject<HTMLDivElement>;
    axisLabelsRef: RefObject<HTMLDivElement>;
    filterState: AnimationTrackingParams[0];
    rangeFilterState: AnimationTrackingParams[1];
    search: AnimationTrackingParams[2];
    activeDimensionKey: AnimationTrackingParams[3];
    setAnimationMode: AnimationTrackingParams[5];
}

/**
 * Wires scroll syncing, animation tracking, card selection and detail-panel closing.
 *
 * @param options - The viewer state and setters the interactions operate on.
 * @returns The id resolver, card click handler and detail close handler.
 */
export function usePivotViewerInteractions<TItem extends object>(
    options: UsePivotViewerInteractionsOptions<TItem>,
) {
    const {
        data,
        getItemId,
        containerRef,
        axisLabelsRef,
        viewMode,
        grouping,
        layout,
        selectedItem,
        zoomLevel,
        containerDimensions,
        preSelectionState,
        filterState,
        rangeFilterState,
        search,
        activeDimensionKey,
        setAnimationMode,
        setZoomLevel,
        setIsZooming,
        setSelectedItem,
        setPreSelectionState,
    } = options;

    const resolveId = useCallback(
        (item: TItem) => resolveInternalItemIndex(data, item, getItemId),
        [data, getItemId],
    );

    // Track animation mode changes
    useAnimationModeTracking(
        filterState,
        rangeFilterState,
        search,
        activeDimensionKey,
        viewMode,
        setAnimationMode,
    );

    // Sync axis labels scroll with container scroll
    useScrollSync(containerRef, axisLabelsRef, viewMode);

    // Handle scroll positioning when switching view modes or grouping changes
    useViewModeScrollHandling({
        containerRef,
        viewMode,
        grouping,
        layout,
        selectedItem,
        zoomLevel,
        resolveId,
        data,
        setPreSelectionState,
    });

    // Handle card selection (click)
    const handleCardClick = useCardSelection({ ...options, resolveId });

    // Handle detail panel close
    const closeDetail = useDetailPanelClose({
        selectedItem,
        preSelectionState,
        zoomLevel,
        viewMode,
        layout,
        containerRef,
        containerDimensions,
        grouping,
        data,
        resolveId,
        setZoomLevel,
        setIsZooming,
        setSelectedItem,
        setPreSelectionState,
    });

    return { resolveId, handleCardClick, closeDetail };
}
