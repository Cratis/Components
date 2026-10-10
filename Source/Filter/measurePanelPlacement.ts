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

function hasFixedContainingStyle(rootStyle: CSSStyleDeclaration): boolean {
    const backdropFilter = rootStyle.getPropertyValue('backdrop-filter');
    return rootStyle.transform !== 'none' || rootStyle.translate !== 'none' ||
        rootStyle.scale !== 'none' || rootStyle.rotate !== 'none' ||
        rootStyle.perspective !== 'none' || rootStyle.filter !== 'none' ||
        backdropFilter !== 'none' && backdropFilter !== '' ||
        /\b(?:layout|paint|strict|content)\b/u.test(rootStyle.contain) ||
        /^(?:size|inline-size)$/u.test(rootStyle.getPropertyValue('container-type')) ||
        /\b(?:transform|translate|scale|rotate|perspective|filter|backdrop-filter|contain|container-type)\b/u
            .test(rootStyle.willChange);
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
    const rootScaleX = rootEdges.origin.width;
    const rootScaleY = rootEdges.origin.height;
    return Math.abs(rootEdges.origin.left - (rootRect.left + parseFloat(rootStyle.borderLeftWidth) * rootScaleX)) <= edgeTolerance &&
        Math.abs(rootEdges.origin.top - (rootRect.top + parseFloat(rootStyle.borderTopWidth) * rootScaleY)) <= edgeTolerance &&
        Math.abs(rootEdges.right - (rootRect.right - parseFloat(rootStyle.borderRightWidth) * rootScaleX)) <= edgeTolerance &&
        Math.abs(rootEdges.bottom - (rootRect.bottom - parseFloat(rootStyle.borderBottomWidth) * rootScaleY)) <= edgeTolerance;
}

function edgesDiffer(a: ProbeEdges, b: ProbeEdges): boolean {
    return Math.abs(a.origin.left - b.origin.left) > edgeTolerance ||
        Math.abs(a.origin.top - b.origin.top) > edgeTolerance ||
        Math.abs(a.right - b.right) > edgeTolerance ||
        Math.abs(a.bottom - b.bottom) > edgeTolerance;
}

/** The modal's rect when the modal or the portal's descendant block owns the fixed containing block. */
function resolveModalClip(
    targets: PlacementTargets,
    edges: ProbeEdges,
): DOMRect | null {
    const { modalRoot, portalContainer, rootProbe } = targets;
    const rootRect = modalRoot && modalRoot.contains(portalContainer)
        ? modalRoot.getBoundingClientRect() : null;
    const rootEdges = rootRect && (rootProbe ? measureProbe(rootProbe) : edges);
    const rootStyle = rootRect && getComputedStyle(modalRoot!);
    // Axis-aligned bounding rects lose the padding origin under rotation/skew.
    // The root's own containing-block properties cover those cases; the probe
    // comparison below still handles nested portal containers geometrically.
    const rootHasFixedContainingStyle = Boolean(rootStyle && hasFixedContainingStyle(rootStyle));
    const rootOwnsBlock = rootHasFixedContainingStyle || Boolean(rootRect && rootEdges && rootStyle &&
        edgesMatchPaddingBox(rootEdges, rootRect, rootStyle));
    const descendantOwnsBlock = Boolean(rootEdges && rootProbe && edgesDiffer(edges, rootEdges));
    const modalRect = rootOwnsBlock || descendantOwnsBlock ? rootRect : null;
    // Layoutless environments cannot supply a modal clip rect.
    return modalRect && modalRect.right > modalRect.left && modalRect.bottom > modalRect.top
        ? modalRect : null;
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
    const bounds = {
        left: Math.max(0, clip?.left ?? 0),
        top: Math.max(0, clip?.top ?? 0),
        right: Math.min(viewport.width, clip?.right ?? viewport.width),
        bottom: Math.min(viewport.height, clip?.bottom ?? viewport.height),
    };
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
