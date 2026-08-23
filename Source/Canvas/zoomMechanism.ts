// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Whether this device can receive multi-touch gestures (pinch/pan) — true for iPad and other touchscreen
 * devices, false for a mouse/trackpad-only machine. `navigator.userAgent` can no longer reliably tell an
 * iPad from a Mac (iPadOS has reported a desktop Safari user agent since iPadOS 13), so capability
 * detection is used instead. Read once at module load — touch capability cannot change mid-session.
 */
const IS_MULTI_TOUCH_CAPABLE = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;

/** The resolved multi-touch capability of the current device — see {@link shouldUseCssZoom}. */
export const isMultiTouchCapableDevice = IS_MULTI_TOUCH_CAPABLE;

/**
 * Decides whether the zoom layer should use crisp CSS `zoom` (re-lays-out and re-rasterizes at the
 * effective resolution — sharp when upscaling) or GPU-composited `transform: scale()` (always correct,
 * marginally softer when upscaling) for a given zoom level and gesture state.
 *
 * Safari on iPadOS has a long-standing, reproducible bug where CSS `zoom` miscalculates descendant
 * `font-size` once a pinch/pan gesture settles: card titles render far smaller than the zoom level
 * implies even though the surrounding box layout scales correctly
 * (see https://developer.apple.com/forums/thread/126189). `transform: scale()` does not share this bug —
 * its scaling is a well-defined GPU composite, not a WebKit relayout — so multi-touch-capable devices skip
 * the crisp-zoom optimization above 100% entirely and always use `transform: scale()`. That is a safe,
 * universal trade (marginally softer upscaled text) for guaranteed-correct font sizing on the affected
 * platform, and it also spares those devices the "re-lays-out the whole board" cost CSS `zoom` carries —
 * not a pure downgrade.
 *
 * `isMultiTouchCapable` is a parameter (rather than read internally) so this decision stays a pure
 * function specs can exercise without touching `navigator`.
 */
export function shouldUseCssZoom(zoom: number, preferTransform: boolean, isMultiTouchCapable: boolean): boolean {
    return zoom > 1 && !preferTransform && !isMultiTouchCapable;
}

/**
 * Applies the board zoom to the inner layer using the hybrid mechanism decided by {@link shouldUseCssZoom}.
 * Also used to compute the initial inline style so the first paint already matches, avoiding a flash
 * before the first imperative apply.
 *
 * While a zoom gesture is in motion (`preferTransform`), `transform: scale()` is used for the WHOLE range:
 * CSS `zoom` re-lays-out the entire mounted board on every step (and resizes every observed card, firing
 * the connection ResizeObservers), which is what made zooming in jerky while panning stayed smooth. The
 * raster-scaled softness above 100% only lasts while the gesture is moving — the settle timer re-applies
 * the crisp CSS `zoom` the moment it stops, except on multi-touch-capable devices, which never do.
 */
export function applyZoomLayer(element: HTMLElement, zoom: number, preferTransform = false): void {
    if (shouldUseCssZoom(zoom, preferTransform, IS_MULTI_TOUCH_CAPABLE)) {
        element.style.transform = '';
        element.style.transformOrigin = '';
        element.style.zoom = `${zoom}`;
    } else {
        element.style.zoom = '';
        element.style.transformOrigin = '0 0';
        element.style.transform = `scale(${zoom})`;
    }
}
