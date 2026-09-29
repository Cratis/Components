// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Optional product compositor/capture marker names applied by {@link Canvas}. */
export interface CanvasCaptureAttributes {
    /** Attribute placed on the Pixi canvas so a product capture pipeline can exclude it. */
    layer?: string;
    /** Attribute placed on non-plain integrated controls that own composited content. */
    content?: string;
    /** Attribute placed on pan/zoom transform hosts whose churn moves existing layers. */
    transformHost?: string;
}
