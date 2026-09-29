// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Safari's non-standard trackpad/touch gesture event — absent from the DOM type library, so typed here
 * rather than asserted through `any`. `scale` is cumulative relative to the gesture's start.
 */
export interface WebKitGestureEvent extends Event {
    /** The gesture's cumulative scale factor since gesturestart. */
    readonly scale: number;

    /** The gesture's horizontal viewport coordinate. */
    readonly clientX: number;

    /** The gesture's vertical viewport coordinate. */
    readonly clientY: number;
}
