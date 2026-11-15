// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Edges of a fixed-position probe's containing block. */
export interface ProbeEdges {
    origin: DOMRect;
    bottom: number;
    right: number;
}

/** Inline style that makes an element a fixed, invisible, 1px probe. */
export const probeStyle = 'position:fixed;left:0;top:0;width:1px;height:1px;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none';

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
