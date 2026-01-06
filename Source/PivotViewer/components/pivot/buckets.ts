// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import type { CardColors } from './constants';
import type { GroupingResult, LayoutResult } from '../../engine/types';

export function updateBucketBackgrounds(
  bucketsContainer: PIXI.Container | null,
  container: HTMLDivElement | null,
  grouping: GroupingResult,
  layout: LayoutResult,
  zoomLevel: number,
  cardColors: CardColors,
  viewMode: string,
) {
  if (!bucketsContainer) return;

  // keep parameter referenced to avoid unused param lint when callers pass zoomLevel
  void zoomLevel;

  if (!container || grouping.groups.length === 0 || viewMode === 'collection') {
    // If we shouldn't show anything, hide all existing backgrounds
    // We keep the highlight if it exists
    for (const child of bucketsContainer.children) {
      if ((child as any).name !== 'highlight') {
        child.visible = false;
      }
    }
    return;
  }

  // Use layout's total height if available so backgrounds match sprite positions
  const worldHeight = layout.totalHeight || container.clientHeight;

  // Get existing background graphics (excluding highlight)
  const backgroundGraphics = bucketsContainer.children.filter(c => (c as any).name !== 'highlight') as PIXI.Graphics[];
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

    if (minX === Infinity) continue;

    // Prefer explicit bucket width from layout when available
    const bucketWidths = layout.bucketWidths || [];
    const widthFromLayout = bucketWidths[index];
    const width = widthFromLayout && widthFromLayout > 0 ? widthFromLayout : (maxX - minX) || 0;

    if (index % 2 === 0 && width > 0) {
      let bg: PIXI.Graphics;

      if (bgIndex < backgroundGraphics.length) {
        bg = backgroundGraphics[bgIndex];
        bg.clear();
      } else {
        bg = new PIXI.Graphics();
        // Insert before highlight if it exists, otherwise at end
        const highlightIndex = bucketsContainer.children.findIndex(c => (c as any).name === 'highlight');
        if (highlightIndex >= 0) {
          bucketsContainer.addChildAt(bg, highlightIndex);
        } else {
          bucketsContainer.addChild(bg);
        }
      }

      bg.rect(minX, 0, width, worldHeight);
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
  bucketsContainer: PIXI.Container | null,
  container: HTMLDivElement | null,
  grouping: GroupingResult,
  layout: LayoutResult,
  hoveredGroupIndex: number | null,
  cardWidth: number,
  zoomLevel: number,
) {
  if (!bucketsContainer || !container || grouping.groups.length === 0) return;

  // `zoomLevel` is part of the signature for future use; reference it
  // to avoid unused-parameter lint errors when callers pass it.
  void zoomLevel;

  let highlight = bucketsContainer.children.find(child => (child as any).name === 'highlight') as PIXI.Graphics;

  if (!highlight) {
    highlight = new PIXI.Graphics();
    (highlight as any).name = 'highlight';
    bucketsContainer.addChild(highlight);
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

  const worldHeight = layout.totalHeight || container.clientHeight;
  highlight.rect(minX, 0, maxX - minX, worldHeight);
  highlight.fill(0xffffff);
  highlight.alpha = 0.05;
  highlight.visible = true;
}
