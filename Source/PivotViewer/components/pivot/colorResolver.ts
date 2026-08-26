// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DEFAULT_COLORS, type CardColors } from './constants';

export function createCssColorResolver() {
  // A detached canvas's `fillStyle` setter cannot parse relative color functions
  // such as `light-dark(...)` — assigning an unparseable value is a silent no-op,
  // so it stays at the canvas default (opaque black). `--cratis-*`/`--surface-*`
  // resolve to exactly that syntax once the v10-palette fallback chain kicks in
  // (custom properties substitute `var()` textually but leave `light-dark()`
  // unresolved), so every card silently rendered black. A real, attached DOM
  // element resolves any CSS <color> — including `light-dark()` and unresolved
  // `var()` chains — to its used `rgb()`/`rgba()` value via `getComputedStyle`.
  return (cssValue: string, fallback: number): number => {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.color = cssValue.trim();
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();

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
