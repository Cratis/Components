// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import type { CardColors } from './constants';
import type { GroupingResult, LayoutResult } from '../../engine/types';

type UpdateGroupBackgrounds = (
    groupsContainer: PIXI.Container | null,
    container: HTMLDivElement | null,
    grouping: GroupingResult,
    layout: LayoutResult,
    zoomLevel: number,
    cardColors: CardColors,
    viewMode: string,
) => void;

type UpdateHighlight = (
    groupsContainer: PIXI.Container | null,
    container: HTMLDivElement | null,
    grouping: GroupingResult,
    layout: LayoutResult,
    hoveredGroupIndex: number | null,
    cardWidth: number,
    zoomLevel: number,
) => void;

interface BackgroundRequest {
    grouping: GroupingResult;
    layout: LayoutResult;
    zoomLevel: number;
    cardColors: CardColors;
}

interface HighlightRequest {
    grouping: GroupingResult;
    layout: LayoutResult;
    hoveredGroupIndex: number | null;
    cardWidth: number;
    zoomLevel: number;
}

interface WorldExtent {
    startY: number;
    worldHeight: number;
}

export const updateGroupBackgrounds: UpdateGroupBackgrounds = (
    ...[groupsContainer, container, grouping, layout, zoomLevel, cardColors, viewMode]
) => {
    if (!groupsContainer) return;

    if (!container || !hasBackgroundGroups(grouping, viewMode)) {
        hideBackgrounds(groupsContainer);
        return;
    }

    drawBackgrounds(groupsContainer, container, { grouping, layout, zoomLevel, cardColors });
};

export const updateHighlight: UpdateHighlight = (
    ...[groupsContainer, container, grouping, layout, hoveredGroupIndex, cardWidth, zoomLevel]
) => {
    if (!groupsContainer || !container) return;
    if (grouping.groups.length === 0) return;

    drawHighlight(groupsContainer, container, { grouping, layout, hoveredGroupIndex, cardWidth, zoomLevel });
};

function drawBackgrounds(groupsContainer: PIXI.Container, container: HTMLDivElement, request: BackgroundRequest) {
    const { grouping, layout, cardColors } = request;
    const extent = backgroundExtent(container, layout, request.zoomLevel);

    // Get existing background graphics (excluding highlight)
    const backgroundGraphics = groupsContainer.children.filter(
        (c) => c.label !== 'highlight',
    ) as PIXI.Graphics[];
    let bgIndex = 0;

    // Instead of re-deriving bucket geometry from constants, compute bucket bounds
    // directly from the positions stored in the layout so backgrounds align exactly.
    for (let index = 0; index < grouping.groups.length; index++) {
        const bounds = backgroundBounds(grouping.groups[index].ids, index, layout);
        if (!isStripedGroup(index, bounds)) continue;

        paintBackground(backgroundGraphicAt(groupsContainer, backgroundGraphics, bgIndex), bounds, extent, cardColors);
        bgIndex++;
    }

    // Hide unused background graphics
    for (let i = bgIndex; i < backgroundGraphics.length; i++) {
        backgroundGraphics[i].visible = false;
    }
}

function backgroundExtent(container: HTMLDivElement, layout: LayoutResult, zoomLevel: number): WorldExtent {
    // Derive a world-space height that always covers the visible viewport even when zoomed out.
    const { baseWorldHeight, containerWorldHeight } = decorationHeight(container, layout, zoomLevel);
    // Use larger buffer and extend further above the viewport to ensure full coverage
    // when zoomed out and cards are positioned at the bottom
    const bufferWorld = Math.max(500, baseWorldHeight * 0.5, containerWorldHeight);
    return { worldHeight: baseWorldHeight + bufferWorld * 3, startY: -bufferWorld * 2 };
}

function paintBackground(background: PIXI.Graphics, bounds: GroupBounds, extent: WorldExtent, cardColors: CardColors) {
    background.rect(bounds.x, extent.startY, bounds.width, extent.worldHeight);
    background.fill(cardColors.base);
    background.alpha = 0.15;
    background.visible = true;
}

function drawHighlight(groupsContainer: PIXI.Container, container: HTMLDivElement, request: HighlightRequest) {
    const { grouping, layout, cardWidth } = request;
    const highlight = highlightGraphic(groupsContainer);
    highlight.clear();

    const hovered = hoveredGroup(grouping, request.hoveredGroupIndex);
    const bounds = hovered && highlightBounds(hovered.group.ids, hovered.index, layout, cardWidth);
    if (!bounds) {
        highlight.visible = false;
        return;
    }

    const { baseWorldHeight } = decorationHeight(container, layout, request.zoomLevel);
    const bufferWorld = Math.max(200, baseWorldHeight * 0.25);
    const worldHeight = baseWorldHeight + bufferWorld * 2;
    const startY = -bufferWorld;

    highlight.rect(bounds.x, startY, bounds.width, worldHeight);
    highlight.fill(0xffffff);
    highlight.alpha = 0.05;
    highlight.visible = true;
}

interface GroupBounds {
    x: number;
    width: number;
}

function hasBackgroundGroups(grouping: GroupingResult, viewMode: string) {
    return grouping.groups.length !== 0 && viewMode !== 'collection';
}

function isStripedGroup(index: number, bounds: GroupBounds | undefined): bounds is GroupBounds {
    if (!bounds) return false;
    return index % 2 === 0 && bounds.width > 0;
}

function hoveredGroup(grouping: GroupingResult, index: number | null) {
    if (index === null || index < 0) return undefined;
    const group = grouping.groups[index];
    if (!group || group.ids.length === 0) return undefined;
    return { group, index };
}

function backgroundWidth(explicit: number | undefined, minX: number, maxX: number) {
    return explicit && explicit > 0 ? explicit : ((maxX - minX) || 0);
}

function hideBackgrounds(container: PIXI.Container) {
    for (const child of container.children) {
        if (child.label !== 'highlight') child.visible = false;
    }
}

function decorationHeight(container: HTMLDivElement, layout: LayoutResult, zoomLevel: number) {
    const invScale = zoomLevel ? 1 / zoomLevel : 1;
    const containerWorldHeight = Math.max(
        (container.scrollHeight || container.clientHeight) * invScale,
        container.clientHeight * invScale,
    );
    return { containerWorldHeight, baseWorldHeight: Math.max(layout.totalHeight || 0, containerWorldHeight) };
}

function itemBounds(ids: Uint32Array, layout: LayoutResult, cardWidth = 0) {
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < ids.length; i++) {
        const pos = layout.positions.get(ids[i]);
        if (pos) {
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x + cardWidth);
        }
    }
    return { minX, maxX };
}

function backgroundBounds(ids: Uint32Array, index: number, layout: LayoutResult) {
    const { minX, maxX } = itemBounds(ids, layout);
    const widthFromLayout = layout.bucketWidths?.[index];
    const xFromLayout = layout.groupXs?.[index];
    if (minX === Infinity && xFromLayout === undefined) return undefined;
    return {
        width: backgroundWidth(widthFromLayout, minX, maxX),
        x: xFromLayout !== undefined ? xFromLayout : minX,
    };
}

function highlightBounds(ids: Uint32Array, index: number, layout: LayoutResult, cardWidth: number) {
    const widthFromLayout = layout.bucketWidths?.[index];
    const xFromLayout = layout.groupXs?.[index];
    if (widthFromLayout !== undefined && xFromLayout !== undefined) {
        return { x: xFromLayout, width: widthFromLayout };
    }
    const { minX, maxX } = itemBounds(ids, layout, cardWidth);
    return minX === Infinity ? undefined : { x: minX, width: maxX - minX };
}

function backgroundGraphicAt(container: PIXI.Container, backgrounds: PIXI.Graphics[], index: number) {
    if (index < backgrounds.length) {
        const background = backgrounds[index];
        background.clear();
        return background;
    }
    const background = new PIXI.Graphics();
    // Insert before highlight if it exists, otherwise at end.
    const highlightIndex = container.children.findIndex(child => child.label === 'highlight');
    if (highlightIndex >= 0) container.addChildAt(background, highlightIndex);
    else container.addChild(background);
    return background;
}

function highlightGraphic(container: PIXI.Container) {
    let highlight = container.children.find(child => child.label === 'highlight') as PIXI.Graphics;
    if (!highlight) {
        highlight = new PIXI.Graphics();
        highlight.label = 'highlight';
        container.addChild(highlight);
    }
    return highlight;
}
