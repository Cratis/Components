// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DEFAULT_COLORS, type CardColors } from './constants';

export function createCssColorResolver() {
  let context: CanvasRenderingContext2D | null | undefined;
  const getContext = () => {
    if (context !== undefined) return context;
    if (typeof document === 'undefined') return null;
    context = document.createElement('canvas').getContext('2d');
    return context;
  };

  const parseHex = (val: string): number | null => {
    if (!val.startsWith('#')) return null;
    const hex = val.slice(1);
    const normalized = hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex.length === 4
        ? hex.slice(0, 3).split('').map((c) => c + c).join('')
        : hex.length === 6
          ? hex
          : hex.length === 8
            ? hex.slice(0, 6)
            : null;
    return normalized ? Number.parseInt(normalized, 16) : null;
  };

  return (cssValue: string, fallback: number): number => {
    const ctx = getContext();
    if (!ctx) return fallback;
    ctx.fillStyle = cssValue.trim();
    const resolved = ctx.fillStyle; // normalized by canvas
    const hex = parseHex(resolved);
    if (hex !== null && Number.isFinite(hex)) {
      return hex;
    }

    if (resolved.startsWith('rgb')) {
      const nums = resolved
        .replace(/rgba?\(/, '')
        .replace(/\)/, '')
        .split(',')
        .map((n) => Number.parseFloat(n.trim()))
        .filter((n) => !Number.isNaN(n));
      if (nums.length >= 3) {
        const [r, g, b] = nums;
        return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
      }
    }

    return fallback;
  };
}

export function resolveCardColors(
  cssColorResolver: (s: string, f: number) => number,
  element?: Element,
): CardColors {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return DEFAULT_COLORS;
  }
  const style = getComputedStyle(element ?? document.documentElement);
  const getVar = (name: string, fallback: number) =>
    cssColorResolver(style.getPropertyValue(name) || name, fallback);

  return {
    base: getVar('--cratis-surface-card', DEFAULT_COLORS.base),
    mid: getVar('--cratis-surface-section', DEFAULT_COLORS.mid),
    gradient: getVar('--cratis-surface-ground', DEFAULT_COLORS.gradient),
    border: getVar('--cratis-surface-border', DEFAULT_COLORS.border),
    text: getVar('--cratis-text-color', DEFAULT_COLORS.text),
    textSecondary: getVar('--cratis-text-color-secondary', DEFAULT_COLORS.textSecondary),
  };
}
