// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type * as PIXI from 'pixi.js';

export const ANIMATION_SPEED = 0.15;
export const CARD_PADDING = 10;
export const CARD_RADIUS = 12;
export const CARD_GAP = 8; // Gap between cards (must match layout gap)

// Fallbacks tuned to PrimeReact lara-dark-blue aesthetic; actual values resolved from CSS variables
export const DEFAULT_COLORS = {
  base: 0x0f2745,        // surface-b-ish deep blue
  mid: 0x163359,         // surface-a-ish
  gradient: 0x0b1e36,    // ground backdrop
  border: 0x2e66ba,      // primary-500 for accents
  text: 0xffffff,
  textSecondary: 0xa8b2c2,
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
