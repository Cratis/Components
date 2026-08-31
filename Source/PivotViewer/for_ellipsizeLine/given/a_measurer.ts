// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MeasureText } from '../../components/pivot/ellipsize';

/** Width of one character in the fake font every spec measures with. */
export const characterWidth = 10;

/**
 * Measures as a fixed-width font would, so a budget can be expressed as a character count and the
 * expected cut is obvious from the spec.
 */
export const fixedWidth: MeasureText = candidate => candidate.length * characterWidth;
