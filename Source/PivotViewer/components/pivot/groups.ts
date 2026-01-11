// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import type { CardColors } from './constants';
import type { GroupingResult, LayoutResult } from '../../engine/types';

export function updateGroupBackgrounds(
  groupsContainer: PIXI.Container | null,
  container: HTMLDivElement | null,
  grouping: GroupingResult,
  layout: LayoutResult,
  zoomLevel: number,
  cardColors: CardColors,
  viewMode: string,
) {
  if (!groupsContainer) return;

  // keep parameter referenced to avoid unused param lint when callers pass zoomLevel
  void zoomLevel;

  if (!container || grouping.groups.length === 0 || viewMode === 'collection') {
    // If we shouldn't show anything, hide all existing backgrounds
    // We keep the highlight if it exists
    for (const child of groupsContainer.children) {
      if ((child as unknown as { name?: string }).name !== 'highlight') {
        child.visible = false;
      }
    }
    return;
  }

  // Derive a world-space height that always covers the visible viewport even when zoomed out.
  const invScale = zoomLevel && zoomLevel !== 0 ? 1 / zoomLevel : 1;
  const containerWorldHeight = Math.max(
    (container.scrollHeight || container.clientHeight) * invScale,
    container.clientHeight * invScale,
  );
  const baseWorldHeight = Math.max(layout.totalHeight || 0, containerWorldHeight);
  // Use larger buffer and extend further above the viewport to ensure full coverage
  // when zoomed out and cards are positioned at the bottom
  const bufferWorld = Math.max(500, baseWorldHeight * 0.5, containerWorldHeight);
  const worldHeight = baseWorldHeight + bufferWorld * 3;
  const startY = -bufferWorld * 2;

  // Get existing background graphics (excluding highlight)
  const backgroundGraphics = groupsContainer.children.filter(c => (c as unknown as { name?: string }).name !== 'highlight') as PIXI.Graphics[];
  let bgIndex = 0;

  // Instead of re-deriving bucket geometry from constants, compute bucket bounds
  // directly from the positions stored in the layout so backgrounds align exactly.
  for (let index = 0; index < grouping.groups.length; index++) {
    const group = grouping.groups[index];
    let minX = Infinity;
    let maxX = -Infinity;

    for (let j = 0; j < group.ids.length; j++) {
      const id = group.ids[j];
      const pos = layout.positions.get(id);
      if (pos) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
      }
    }

    if (minX === Infinity && (!layout.groupXs || layout.groupXs[index] === undefined)) continue;

    // Prefer explicit bucket width and position from layout when available
    const bucketWidths = layout.bucketWidths || [];
    const groupXs = layout.groupXs || [];
    const widthFromLayout = bucketWidths[index];
    const xFromLayout = groupXs[index];

    const width = widthFromLayout && widthFromLayout > 0 ? widthFromLayout : ((maxX - minX) || 0);
    const x = xFromLayout !== undefined ? xFromLayout : minX;

    if (index % 2 === 0 && width > 0) {
      let bg: PIXI.Graphics;

      if (bgIndex < backgroundGraphics.length) {
        bg = backgroundGraphics[bgIndex];
        bg.clear();
      } else {
        bg = new PIXI.Graphics();
        // Insert before highlight if it exists, otherwise at end
        const highlightIndex = groupsContainer.children.findIndex(c => (c as unknown as { name?: string }).name === 'highlight');
        if (highlightIndex >= 0) {
          groupsContainer.addChildAt(bg, highlightIndex);
        } else {
          groupsContainer.addChild(bg);
        }
      }

      bg.rect(x, startY, width, worldHeight);
      bg.fill(cardColors.base);
      bg.alpha = 0.15;
      bg.visible = true;
      bgIndex++;
    }
  }

  // Hide unused background graphics
  for (let i = bgIndex; i < backgroundGraphics.length; i++) {
    backgroundGraphics[i].visible = false;
  }
}

export function updateHighlight(
  groupsContainer: PIXI.Container | null,
  container: HTMLDivElement | null,
  grouping: GroupingResult,
  layout: LayoutResult,
  hoveredGroupIndex: number | null,
  cardWidth: number,
  zoomLevel: number,
) {
  if (!groupsContainer || !container || grouping.groups.length === 0) return;

  const invScale = zoomLevel && zoomLevel !== 0 ? 1 / zoomLevel : 1;

  let highlight = groupsContainer.children.find(child => (child as unknown as { name?: string }).name === 'highlight') as PIXI.Graphics;

  if (!highlight) {
    highlight = new PIXI.Graphics();
    (highlight as unknown as { name: string }).name = 'highlight';
    groupsContainer.addChild(highlight);
  }

  highlight.clear();

  if (hoveredGroupIndex === null || hoveredGroupIndex < 0) {
    highlight.visible = false;
    return;
  }

  const group = grouping.groups[hoveredGroupIndex];
  if (!group || group.ids.length === 0) {
    highlight.visible = false;
    return;
  }

  // Use layout info if available
  const bucketWidths = layout.bucketWidths || [];
  const groupXs = layout.groupXs || [];
  const widthFromLayout = bucketWidths[hoveredGroupIndex];
  const xFromLayout = groupXs[hoveredGroupIndex];

  let rectX = 0;
  let rectWidth = 0;

  if (widthFromLayout !== undefined && xFromLayout !== undefined) {
    rectX = xFromLayout;
    rectWidth = widthFromLayout;
  } else {
    // Fallback: derive from items bounding box
    let minX = Infinity;
    let maxX = -Infinity;

    for (let j = 0; j < group.ids.length; j++) {
      const id = group.ids[j];
      const pos = layout.positions.get(id);
      if (pos) {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x + cardWidth);
      }
    }

    if (minX === Infinity) {
      highlight.visible = false;
      return;
    }
    rectX = minX;
    rectWidth = maxX - minX;
  }

  const containerWorldHeight = Math.max(
    (container.scrollHeight || container.clientHeight) * invScale,
    container.clientHeight * invScale,
  );
  const baseWorldHeight = Math.max(layout.totalHeight || 0, containerWorldHeight);
  const bufferWorld = Math.max(200, baseWorldHeight * 0.25);
  const worldHeight = baseWorldHeight + bufferWorld * 2;
  const startY = -bufferWorld;

  highlight.rect(rectX, startY, rectWidth, worldHeight);
  highlight.fill(0xffffff);
  highlight.alpha = 0.05;
  highlight.visible = true;
}
