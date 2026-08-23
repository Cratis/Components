// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// The data attributes the `@cratis/liquid-glass` solution stamps on DOM subtrees to identify glass
// surfaces (`LAYER_ATTR`) and their own content (`CONTENT_ATTR`), plus a Studio extension marking
// elements whose attribute churn only moves already-marked layers (`TRANSFORM_HOST_ATTR`). Canvas
// only sets these as plain DOM attribute values - it never imports anything else from that package,
// which is a Studio-only workspace package, not published to npm, and therefore cannot be a
// dependency of this shared library. Declaring the values locally still lets a consumer that
// separately mounts `@cratis/liquid-glass` alongside a Canvas from this library scan the DOM for
// these attribute names and get correct behavior with zero extra wiring, as long as the values below
// keep matching Studio's `Source/LiquidGlass/liquid-glass/glass-attributes.ts` - update both together
// if that file's values ever change.

/** Excluded from every glass capture scene: glass effect canvases, and whole subtrees that must
 *  never appear in any refraction (dialogs, 'page'-level components). */
export const LAYER_ATTR = 'data-liquid-glass-layer';

/** A glass component's own content: excluded from the `behind` scene, but still visible (as its own
 *  layer) to higher-level (dialog) surfaces. */
export const CONTENT_ATTR = 'data-liquid-glass-content';

/** An element whose attribute churn (style transforms during pan/zoom) only moves marked layers
 *  inside it and never changes base content - its mutations are ignored; the compositor repositions
 *  the layers per frame. */
export const TRANSFORM_HOST_ATTR = 'data-liquid-glass-transform-host';
