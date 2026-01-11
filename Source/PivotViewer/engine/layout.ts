// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
  LayoutSpec,
  LayoutResult,
  ItemPosition,
  GroupingResult,
  ItemId,
} from './types';
import { CARD_GAP, CANVAS_PADDING } from '../constants';

export function computeLayout(
  grouping: GroupingResult,
  spec: LayoutSpec
): LayoutResult {
  const positions = new Map<ItemId, ItemPosition>();

  if (spec.viewMode === 'collection') {
    return computeCollectionLayout(grouping, spec, positions);
  } else {
    return computeGroupedLayout(grouping, spec, positions);
  }
}

function computeCollectionLayout(
  grouping: GroupingResult,
  spec: LayoutSpec,
  positions: Map<ItemId, ItemPosition>
): LayoutResult {
  const { cardWidth, cardHeight, containerWidth } = spec;
  const slotWidth = cardWidth + CARD_GAP;
  const slotHeight = cardHeight + CARD_GAP;

  // Calculate how many cards fit per row based on container width (include gap)
  const cardsPerRow = Math.max(1, Math.floor((containerWidth + CARD_GAP - (CANVAS_PADDING * 2)) / slotWidth));

  let x = CANVAS_PADDING;
  let y = CANVAS_PADDING;
  let column = 0;
  let itemCount = 0;

  for (const group of grouping.groups) {
    for (let i = 0; i < group.ids.length; i++) {
      const id = group.ids[i];

      positions.set(id, {
        x,
        y,
        groupIndex: 0,
      });

      // Move to next position horizontally (left to right)
      column++;
      x += slotWidth;

      // Wrap to next row when we've filled the width
      if (column >= cardsPerRow) {
        column = 0;
        x = CANVAS_PADDING;
        y += slotHeight;
      }

      itemCount++;
    }
  }

  const rows = Math.ceil(itemCount / cardsPerRow);
  const contentWidth = Math.min(itemCount, cardsPerRow) * slotWidth;

  return {
    positions,
    totalWidth: Math.max(containerWidth, contentWidth + (CANVAS_PADDING * 2)),
    totalHeight: (rows * slotHeight) + (CANVAS_PADDING * 2),
  };
}

function computeGroupedLayout(
  grouping: GroupingResult,
  spec: LayoutSpec,
  positions: Map<ItemId, ItemPosition>
): LayoutResult {
  const { cardWidth, cardHeight, cardsPerColumn } = spec;
  // Override group spacing to ensure consistent card spacing across groups
  // We want visual gap between groups to match gap between cards (CARD_GAP)
  const effectiveGroupSpacing = 0;

  const slotWidth = cardWidth + CARD_GAP;
  const slotHeight = cardHeight + CARD_GAP;
  // Bottom margin of 0 - the CARD_GAP in slotHeight provides sufficient spacing
  // between the bottom card and the footer label
  const BOTTOM_MARGIN = 0;

  // Fixed bucket width: 2 columns of cards per bucket (always)
  const COLUMNS_PER_BUCKET = 2;
  const bucketWidth = COLUMNS_PER_BUCKET * slotWidth;

  let groupX = 0;
  // Use container height for layout, or fallback to cardsPerColumn height
  const layoutHeight = spec.containerHeight || (cardsPerColumn * slotHeight);
  const bucketWidths: number[] = [];
  const groupXs: number[] = [];
  let maxRows = 0;

  // First pass: calculate max rows to determine total height
  for (const group of grouping.groups) {
    const itemsInGroup = group.ids.length;
    const rowsInGroup = Math.ceil(itemsInGroup / COLUMNS_PER_BUCKET);
    maxRows = Math.max(maxRows, rowsInGroup);
  }

  // Calculate actual content height needed (ensure it's at least as tall as the container)
  // We need to fit the tallest column plus the bottom margin
  const contentHeight = Math.max(layoutHeight, (maxRows * slotHeight) + BOTTOM_MARGIN);

  for (let groupIndex = 0; groupIndex < grouping.groups.length; groupIndex++) {
    const group = grouping.groups[groupIndex];
    groupXs.push(groupX);

    const itemsInGroup = group.ids.length;

    for (let i = 0; i < itemsInGroup; i++) {
      const id = group.ids[i];

      // Cards fill from left to right, bottom to top
      // For a 2-column bucket: i=0,1 in row 0; i=2,3 in row 1; etc.
      const col = i % COLUMNS_PER_BUCKET;
      const row = Math.floor(i / COLUMNS_PER_BUCKET);

      // Center the cards within the bucket
      // The bucket width fits 2 slots (2W + 2G). Cards take 2W + G.
      // So we have G/2 padding on each side to center them.
      const x = groupX + (col * slotWidth) + (CARD_GAP / 2);

      // Position cards from bottom of container, stacking upwards, starting at row 0 (bottom)
      const y = CANVAS_PADDING + contentHeight - BOTTOM_MARGIN - ((row + 1) * slotHeight);

      positions.set(id, {
        x,
        y,
        groupIndex,
      });
    }

    // Always use fixed bucket width
    bucketWidths.push(bucketWidth);

    // Advance position by fixed bucket width + spacing
    groupX += bucketWidth;
    if (groupIndex < grouping.groups.length - 1) {
      groupX += effectiveGroupSpacing;
    }
  }

  return {
    positions,
    totalWidth: groupX + CANVAS_PADDING,
    totalHeight: contentHeight + (CANVAS_PADDING * 2),
    bucketWidths,
    groupXs,
  };
}
