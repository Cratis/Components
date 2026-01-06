// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type * as PIXI from 'pixi.js';

export const ANIMATION_SPEED = 0.15;
export const CARD_PADDING = 10;
export const CARD_RADIUS = 12;
export const CARD_GAP = 8; // Gap between cards (must match layout gap)

export const DEFAULT_COLORS = {
  base: 0x1b2b2f,
  mid: 0x234445,
  gradient: 0x2f5b56,
  border: 0x5ad1a0,
  text: 0xffffff,
  textSecondary: 0x8899aa,
};

export type CardColors = typeof DEFAULT_COLORS;

export interface CardSprite {
  container: PIXI.Container;
  graphics: PIXI.Graphics;
  titleText: PIXI.Text;
  labelsText: PIXI.Text;
  valuesText: PIXI.Text;
  itemId: number | string;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  // Animation state
  animationStartTime?: number;
  animationDelay?: number;
  startX?: number;
  startY?: number;
  // Cache state to avoid unnecessary redraws
  lastSelectedId?: string | number | null;
  lastCardColors?: CardColors;
  lastTitle?: string;
  lastLabels?: string;
  lastValues?: string;
}

export default {};
