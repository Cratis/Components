// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A plain, serializable snapshot of an element's viewport rectangle. */
export interface PickedRect {
    /** Left edge, in viewport pixels. */
    x: number;
    /** Top edge, in viewport pixels. */
    y: number;
    /** Width, in pixels. */
    width: number;
    /** Height, in pixels. */
    height: number;
    /** Top edge, in viewport pixels. */
    top: number;
    /** Right edge, in viewport pixels. */
    right: number;
    /** Bottom edge, in viewport pixels. */
    bottom: number;
    /** Left edge, in viewport pixels. */
    left: number;
}
