// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DEFAULT_COLORS, type CardColors } from './constants';

export function createCssColorResolver() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

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
    if (!ctx) {
      return fallback;
    }
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

export function resolveCardColors(cssColorResolver: (s: string, f: number) => number): CardColors {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const getVar = (name: string, fallback: number) =>
    cssColorResolver(style.getPropertyValue(name) || name, fallback);

  return {
    base: getVar('--surface-b', DEFAULT_COLORS.base),
    mid: getVar('--surface-a', DEFAULT_COLORS.mid),
    gradient: getVar('--surface-ground', DEFAULT_COLORS.gradient),
    border: getVar('--surface-border', DEFAULT_COLORS.border),
    text: getVar('--text-color', DEFAULT_COLORS.text),
    textSecondary: getVar('--text-color-secondary', DEFAULT_COLORS.textSecondary),
  };
}
