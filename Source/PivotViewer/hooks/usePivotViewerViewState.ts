// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { ViewMode } from '../components/Toolbar';

export interface PreSelectionState {
    zoom: number;
    scrollLeft: number;
    scrollTop: number;
}

/**
 * Holds the transient UI state of a PivotViewer: search text, view mode, panel visibility,
 * selection, zoom/hover flags and scroll position.
 * @returns The state values with their setters.
 */
export function usePivotViewerViewState<TItem extends object>() {
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('collection');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<TItem | null>(null);
    const [isZooming, setIsZooming] = useState(false);
    const [hoveredGroupIndex, setHoveredGroupIndex] = useState<number | null>(null);
    const [preSelectionState, setPreSelectionState] = useState<PreSelectionState | null>(null);
    const [, setAnimationMode] = useState<'layout' | 'filter'>('layout');
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

    return {
        search,
        setSearch,
        viewMode,
        setViewMode,
        filtersOpen,
        setFiltersOpen,
        selectedItem,
        setSelectedItem,
        isZooming,
        setIsZooming,
        hoveredGroupIndex,
        setHoveredGroupIndex,
        preSelectionState,
        setPreSelectionState,
        setAnimationMode,
        scrollPosition,
        setScrollPosition,
    };
}
