// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// How small the fitted text is allowed to get. Notes live on a canvas that zooms, so text too small to
// read at 1:1 is still perfectly legible one zoom step in — shrinking is a far better answer than
// hiding the text behind an affordance, and the floor is set low enough to say so. Only text that will
// not fit even at this size falls back to the expand affordance.
export const MIN_FONT_SIZE = 4;
export const MAX_FONT_SIZE = 120;
export const PADDING = 12;
export const LINE_HEIGHT_RATIO = 1.4;
