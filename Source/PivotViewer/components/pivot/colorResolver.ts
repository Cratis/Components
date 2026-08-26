// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DEFAULT_COLORS, type CardColors } from './constants';

export type CssColorResolver = (
    cssValue: string,
    fallback: string,
    element?: Element,
) => string;

const byteAsHex = (value: number) => value.toString(16).padStart(2, '0');
const clamp = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value));
const parseChannel = (value: string) =>
    value.endsWith('%')
        ? clamp(Number.parseFloat(value) * 2.55, 255)
        : clamp(Number.parseFloat(value), 255);
const parseAlpha = (value: string | undefined) => {
    if (!value) return 1;
    const parsed = value.endsWith('%')
        ? Number.parseFloat(value) / 100
        : Number.parseFloat(value);
    return clamp(parsed, 1);
};

const colorFromSimpleSerialization = (value: string): string | undefined => {
    const hex = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1];
    if (hex) {
        const expanded =
            hex.length <= 4
                ? hex
                      .split('')
                      .map((character) => character + character)
                      .join('')
                : hex;
        const red = Number.parseInt(expanded.slice(0, 2), 16);
        const green = Number.parseInt(expanded.slice(2, 4), 16);
        const blue = Number.parseInt(expanded.slice(4, 6), 16);
        const alpha =
            expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
        return `rgba(${red},${green},${blue},${alpha})`;
    }

    const functional = value.match(/^rgba?\((.*)\)$/i)?.[1];
    if (!functional) return undefined;

    const slashParts = functional.split(/\s*\/\s*/u);
    const commaSeparated = slashParts[0].includes(',');
    const parts = commaSeparated
        ? slashParts[0].split(',').map((part) => part.trim())
        : slashParts[0].trim().split(/\s+/u);
    const alphaPart =
        slashParts[1] ?? (commaSeparated && parts.length === 4 ? parts.pop() : undefined);
    if (parts.length !== 3) return undefined;

    const channels = parts.map(parseChannel);
    const alpha = parseAlpha(alphaPart);
    if ([...channels, alpha].some((component) => !Number.isFinite(component)))
        return undefined;

    const [red, green, blue] = channels.map(Math.round);
    return `rgba(${red},${green},${blue},${alpha})`;
};

const colorFromCanvas = (
    context: CanvasRenderingContext2D,
    cssValue: string,
): string | undefined => {
    context.fillStyle = '#010203';
    context.fillStyle = cssValue;
    const firstSerialization = context.fillStyle;

    context.fillStyle = '#fefdfc';
    context.fillStyle = cssValue;
    const secondSerialization = context.fillStyle;

    // An unsupported assignment leaves each different sentinel in place. A
    // supported color serializes identically after both assignments.
    if (firstSerialization !== secondSerialization) return undefined;

    context.clearRect(0, 0, 1, 1);
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;

    return `#${byteAsHex(red)}${byteAsHex(green)}${byteAsHex(blue)}${byteAsHex(alpha)}`;
};

/**
 * Creates a browser CSS-color resolver for Pixi-compatible color sources.
 *
 * A detached canvas's `fillStyle` setter cannot resolve relative functions such
 * as `light-dark(...)` or custom-property chains. Resolve on an attached DOM
 * element first. Pixi handles common CSS serializations directly; modern CSS
 * Color 4 values are rasterized through a one-pixel canvas so `oklch()`, `lab()`,
 * and wide-gamut `color(...)` values become sRGB while preserving alpha.
 */
export function createCssColorResolver(): CssColorResolver {
    let context: CanvasRenderingContext2D | null | undefined;
    const getContext = () => {
        if (context !== undefined) return context;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            context = canvas.getContext('2d', { willReadFrequently: true });
        } catch {
            context = null;
        }
        return context;
    };

    return (cssValue: string, fallback: string, element?: Element): string => {
        if (
            typeof document === 'undefined' ||
            typeof getComputedStyle === 'undefined' ||
            cssValue.trim().length === 0
        ) {
            return fallback;
        }

        const host = element ?? document.body ?? document.documentElement;
        if (!host) return fallback;

        const probe = document.createElement('span');
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.pointerEvents = 'none';
        probe.style.color = cssValue.trim();
        if (!probe.style.color) return fallback;

        host.append(probe);

        try {
            const resolved = getComputedStyle(probe).color;
            if (!resolved) return fallback;

            const simpleColor = colorFromSimpleSerialization(resolved);
            if (simpleColor) return simpleColor;

            if (
                typeof CSS === 'undefined' ||
                typeof CSS.supports !== 'function' ||
                !CSS.supports('color', resolved)
            ) {
                return fallback;
            }

            const canvasContext = getContext();
            return canvasContext
                ? (colorFromCanvas(canvasContext, resolved) ?? fallback)
                : fallback;
        } finally {
            probe.remove();
        }
    };
}

/**
 * Observes the environment that can change inherited semantic colors.
 * @returns A cleanup callback that disconnects every observer/listener.
 */
export function observeColorEnvironment(element: Element, onChange: () => void) {
    if (typeof MutationObserver === 'undefined') return () => undefined;

    const observer = new MutationObserver(onChange);
    let ancestor: Element | null = element;
    while (ancestor) {
        observer.observe(ancestor, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme'],
        });
        ancestor = ancestor.parentElement;
    }

    const colorScheme =
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : undefined;
    colorScheme?.addEventListener('change', onChange);

    return () => {
        observer.disconnect();
        colorScheme?.removeEventListener('change', onChange);
    };
}

export function resolveCardColors(
    cssColorResolver: CssColorResolver,
    element?: Element,
): CardColors {
    if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
        return DEFAULT_COLORS;
    }

    const style = getComputedStyle(element ?? document.documentElement);
    const getVar = (name: string, fallback: string) => {
        const value = style.getPropertyValue(name).trim();
        return value ? cssColorResolver(value, fallback, element) : fallback;
    };

    return {
        base: getVar('--cratis-surface-card', DEFAULT_COLORS.base),
        mid: getVar('--cratis-surface-section', DEFAULT_COLORS.mid),
        gradient: getVar('--cratis-surface-ground', DEFAULT_COLORS.gradient),
        border: getVar('--cratis-surface-border', DEFAULT_COLORS.border),
        text: getVar('--cratis-text-color', DEFAULT_COLORS.text),
        textSecondary: getVar(
            '--cratis-text-color-secondary',
            DEFAULT_COLORS.textSecondary,
        ),
    };
}
