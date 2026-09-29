// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { GroupingResult, ItemId, LayoutResult } from '../engine/types';
import type { PivotViewerColors } from '../types';
import type { ViewMode } from './Toolbar';

/** Props for the Pixi card renderer inside a PivotViewer viewport. */
export interface PivotCanvasProps<TItem extends object> {
    /** Original items array */
    items: TItem[];

    /** Layout positions */
    layout: LayoutResult;

    /** Grouping information */
    grouping: GroupingResult;

    /** Visible item IDs */
    visibleIds: Uint32Array;

    /** Card dimensions */
    cardWidth: number;
    cardHeight: number;

    /** Zoom level */
    zoomLevel: number;

    /** Pan offset */
    panX: number;
    panY: number;

    /** Viewport dimensions (visible area) */
    viewportWidth: number;
    viewportHeight: number;

    /** Selected item ID */
    selectedId: ItemId | null;

    /** Hovered group index */
    hoveredGroupIndex: number | null;

    /** Current view mode */
    viewMode: ViewMode;

    /** Is zooming animation in progress */
    isZooming?: boolean;

    /** Card renderer function - returns structured data for display */
    cardRenderer: (item: TItem) => {
        title: string;
        labels?: string[];
        values?: string[];
    };

    /** Public color overrides; changes trigger a Pixi color refresh. */
    colorOverrides?: Partial<PivotViewerColors>;

    /** ID resolver */
    resolveId: (item: TItem, index: number) => string | number;

    /** Click handler */
    onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void;

    /** Pan handlers */
    onPanStart: (e: React.MouseEvent) => void;
    onPanMove: (e: React.MouseEvent) => void;
    onPanEnd: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}
