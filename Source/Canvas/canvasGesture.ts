// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

type GestureListener = (active: boolean) => void;

const listeners = new Set<GestureListener>();
let active = false;

/**
 * A lightweight signal for when a canvas pan/zoom gesture is in motion, shared between the canvas (which
 * drives it from wheel activity) and consumers that must stay quiet mid-gesture — most importantly the
 * board's viewport virtualization, whose mount/unmount churn during a zoom would otherwise fight the
 * gesture frame budget. A module singleton rather than context because only one canvas is interactive at a
 * time and the consumers sit far down the tree.
 */
export const canvasGesture = {
    /** Whether a gesture is currently in motion. */
    get isActive(): boolean {
        return active;
    },

    /** Marks a gesture as started or settled, notifying subscribers on the transition. */
    set(activeNow: boolean): void {
        if (active === activeNow) return;
        active = activeNow;
        listeners.forEach(listener => listener(activeNow));
    },

    /** Subscribes to gesture start/settle transitions; returns the unsubscribe function. */
    subscribe(listener: GestureListener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};
