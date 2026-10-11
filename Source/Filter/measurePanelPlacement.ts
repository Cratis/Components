// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveDropdownPosition, type DropdownPosition } from './utils';

/** Fixed-position panel placement, optionally with a clamped CSS width. */
export type PanelPosition = DropdownPosition & { width?: number };

/** Edges of a fixed-position probe's containing block. */
interface ProbeEdges {
    origin: DOMRect;
    bottom: number;
    right: number;
}

/** The probes (and the elements they sit in) the panel placement is measured against. */
export interface PlacementTargets {
    probe: HTMLDivElement;
    rootProbe: HTMLDivElement | null;
    modalRoot: HTMLElement | null | undefined;
    portalContainer: HTMLElement;
    panel: HTMLDivElement;
    anchor: HTMLButtonElement;
}

/** Inline style that makes an element a fixed, invisible, 1px probe. */
export const probeStyle = 'position:fixed;left:0;top:0;width:1px;height:1px;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none';

const edgeTolerance = 0.5;
const viewportGutter = 32;

/** Measures the origin, bottom and right edges of a fixed probe's containing block. */
export function measureProbe(element: HTMLDivElement): ProbeEdges {
    element.style.top = '0';
    element.style.bottom = 'auto';
    const origin = element.getBoundingClientRect();
    element.style.top = 'auto';
    element.style.bottom = '0';
    const bottom = element.getBoundingClientRect().bottom;
    element.style.bottom = 'auto';
    element.style.left = 'auto';
    element.style.right = '0';
    const right = element.getBoundingClientRect().right;
    element.style.left = '0';
    element.style.right = 'auto';
    return { origin, bottom, right };
}

/** Layoutless renderers report zero; browser layout uses the scrollbar-free viewport. */
function readViewport(): { width: number; height: number } {
    // In quirks mode the viewport's client size is reported on the body, not the root.
    const viewportElement = document.compatMode === 'BackCompat' ? document.body : document.documentElement;
    return {
        width: viewportElement.clientWidth || window.innerWidth,
        height: viewportElement.clientHeight || window.innerHeight,
    };
}

/** Properties whose non-"none" value makes an element the containing block of fixed descendants. */
const fixedContainingProperties = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'] as const;

const containLayoutPattern = /\b(?:layout|paint|strict|content)\b/u;
const containerTypePattern = /^(?:size|inline-size)$/u;
const willChangePattern = /\b(?:transform|translate|scale|rotate|perspective|filter|backdrop-filter|contain|container-type)\b/u;

function hasBackdropFilter(rootStyle: CSSStyleDeclaration): boolean {
    const backdropFilter = rootStyle.getPropertyValue('backdrop-filter');
    return backdropFilter !== 'none' && backdropFilter !== '';
}

function hasFixedContainingStyle(rootStyle: CSSStyleDeclaration): boolean {
    if (fixedContainingProperties.some(property => rootStyle[property] !== 'none')) return true;
    if (hasBackdropFilter(rootStyle)) return true;
    return containLayoutPattern.test(rootStyle.contain) ||
        containerTypePattern.test(rootStyle.getPropertyValue('container-type')) ||
        willChangePattern.test(rootStyle.willChange);
}

/**
 * A fixed probe spans its containing block, not the Dialog's overflow box.
 * Compare all four edges to the root's padding box: a side dialog can share
 * the positioner's top-left origin without sharing its containing block.
 * Comparing to innerWidth/innerHeight instead would mistake classic scrollbars
 * (excluded from the layout viewport) for a transformed containing block.
 */
function edgesMatchPaddingBox(
    rootEdges: ProbeEdges,
    rootRect: DOMRect,
    rootStyle: CSSStyleDeclaration,
): boolean {
    const scaleX = rootEdges.origin.width;
    const scaleY = rootEdges.origin.height;
    const pairs: Array<[number, number]> = [
        [rootEdges.origin.left, rootRect.left + parseFloat(rootStyle.borderLeftWidth) * scaleX],
        [rootEdges.origin.top, rootRect.top + parseFloat(rootStyle.borderTopWidth) * scaleY],
        [rootEdges.right, rootRect.right - parseFloat(rootStyle.borderRightWidth) * scaleX],
        [rootEdges.bottom, rootRect.bottom - parseFloat(rootStyle.borderBottomWidth) * scaleY],
    ];
    return pairs.every(([actual, expected]) => Math.abs(actual - expected) <= edgeTolerance);
}

function edgesDiffer(a: ProbeEdges, b: ProbeEdges): boolean {
    const pairs: Array<[number, number]> = [
        [a.origin.left, b.origin.left],
        [a.origin.top, b.origin.top],
        [a.right, b.right],
        [a.bottom, b.bottom],
    ];
    return pairs.some(([first, second]) => Math.abs(first - second) > edgeTolerance);
}

/** Layoutless environments cannot supply a modal clip rect. */
function hasLayout(rect: DOMRect): boolean {
    return rect.right > rect.left && rect.bottom > rect.top;
}

function rootOwnsBlock(rootEdges: ProbeEdges, rootRect: DOMRect, rootStyle: CSSStyleDeclaration): boolean {
    return hasFixedContainingStyle(rootStyle) || edgesMatchPaddingBox(rootEdges, rootRect, rootStyle);
}

/** The modal's rect when the modal or the portal's descendant block owns the fixed containing block. */
function resolveModalClip(
    targets: PlacementTargets,
    edges: ProbeEdges,
): DOMRect | null {
    const { modalRoot, portalContainer, rootProbe } = targets;
    if (!modalRoot || !modalRoot.contains(portalContainer)) return null;
    const rootRect = modalRoot.getBoundingClientRect();
    const rootEdges = rootProbe ? measureProbe(rootProbe) : edges;
    const rootStyle = getComputedStyle(modalRoot);
    // Axis-aligned bounding rects lose the padding origin under rotation/skew.
    // The root's own containing-block properties cover those cases; the probe
    // comparison below still handles nested portal containers geometrically.
    const descendantOwnsBlock = rootProbe !== null && edgesDiffer(edges, rootEdges);
    if (!rootOwnsBlock(rootEdges, rootRect, rootStyle) && !descendantOwnsBlock) return null;
    return hasLayout(rootRect) ? rootRect : null;
}

/** The viewport rectangle, narrowed to the modal clip when there is one. */
function resolveBounds(viewport: { width: number; height: number }, clip: DOMRect | null) {
    return {
        left: Math.max(0, clip?.left ?? 0),
        top: Math.max(0, clip?.top ?? 0),
        right: Math.min(viewport.width, clip?.right ?? viewport.width),
        bottom: Math.min(viewport.height, clip?.bottom ?? viewport.height),
    };
}

/** Measures the CSS width without a previous resize's inline clamp applied. */
function measureCssWidth(panel: HTMLDivElement): number {
    const previousWidth = panel.style.width;
    if (previousWidth) panel.style.width = '';
    const cssWidth = panel.offsetWidth;
    if (previousWidth) panel.style.width = previousWidth;
    return cssWidth;
}

/**
 * Computes where the fixed-position panel belongs so it stays attached to its anchor
 * and clamped inside the viewport (or the modal that clips it).
 */
export function measurePanelPlacement(targets: PlacementTargets): PanelPosition {
    const { probe, panel, anchor: anchorElement } = targets;
    // The probe stays mounted while open, but its origin must be read on every
    // update: scrolling a transformed ancestor changes its viewport coordinates.
    const edges = measureProbe(probe);
    const { origin, bottom: containingBlockBottom } = edges;

    // offsetWidth is in local CSS pixels; the probe's rect supplies the viewport scale.
    // Preserve the viewport gutter even when a containing block scales the dropdown.
    const scaleX = origin.width || 1;
    const scaleY = origin.height || 1;
    const viewport = readViewport();
    const clip = resolveModalClip(targets, edges);
    const bounds = resolveBounds(viewport, clip);
    const visible = {
        width: Math.max(0, bounds.right - bounds.left),
        height: Math.max(0, bounds.bottom - bounds.top),
    };
    const cssWidth = measureCssWidth(panel);
    const width = cssWidth * scaleX > visible.width - viewportGutter
        ? Math.max(0, (visible.width - viewportGutter) / scaleX)
        : undefined;
    const anchor = anchorElement.getBoundingClientRect();
    const viewportPosition = resolveDropdownPosition({
        left: anchor.left - bounds.left,
        top: anchor.top - bounds.top,
        bottom: anchor.bottom - bounds.top,
    }, visible, (width ?? cssWidth) * scaleX);
    return {
        left: (bounds.left + viewportPosition.left - origin.left) / scaleX,
        top: viewportPosition.top === undefined ? undefined : (bounds.top + viewportPosition.top - origin.top) / scaleY,
        bottom: viewportPosition.bottom === undefined ? undefined
            : (containingBlockBottom - (bounds.bottom - viewportPosition.bottom)) / scaleY,
        maxHeight: viewportPosition.maxHeight / scaleY,
        width,
    };
}
