// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The class every canvas puts on its container element. */
export const CANVAS_SURFACE_CLASS = 'canvas-surface';

const MODAL_SELECTOR = '[aria-modal="true"], [data-cratis-dialog-id]';

/**
 * Whether a wheel or pinch over the canvas belongs to something else in front of it: another canvas
 * (one inside a dialog, or one nested in this canvas) or a modal dialog this canvas is not part of.
 * Such a gesture is left alone, so a pinch on an editor's canvas does not also zoom the board behind
 * it. Content of the canvas's own that is portalled out of its subtree (toolbars, menus, the minimap)
 * is not claimed by anything, so pinching over it still zooms the canvas.
 */
export function isClaimedByAnotherSurface(target: EventTarget | null, container: HTMLElement): boolean {
    const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
    if (!element) return false;

    const surface = element.closest(`.${CANVAS_SURFACE_CLASS}`);
    if (surface && surface !== container && !surface.contains(container)) return true;

    const modal = element.closest(MODAL_SELECTOR);
    return !!modal && !modal.contains(container);
}
