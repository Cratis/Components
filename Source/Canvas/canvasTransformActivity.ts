// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

type TransformListener = () => void;

const listeners = new Set<TransformListener>();

// The per-frame heartbeat of the one transform writer (the canvas's applyWorldTransform): every
// applied pan/zoom frame notifies, whether it came from a gesture, touch momentum, a smooth
// pan/zoom animation or a tour camera. Followers that position themselves from the live transform
// (collaborator cursors, the selection toolbar, tour anchors) subscribe here to wake exactly when
// the transform moves instead of polling it on every animation frame — so an idle board notifies
// nobody and issues no frame callbacks. A module singleton for the same reason canvasGesture is:
// only one canvas is interactive at a time and the consumers sit far down the tree.
/**
 * The per-frame heartbeat of the one transform writer (the canvas's applyWorldTransform): every
 * applied pan/zoom frame notifies, whether it came from a gesture, touch momentum, a smooth
 * pan/zoom animation or a tour camera. Followers that position themselves from the live transform
 * (collaborator cursors, the selection toolbar, tour anchors) subscribe here to wake exactly when
 * the transform moves instead of polling it on every animation frame.
 */
export const canvasTransformActivity = {
    notify(): void {
        listeners.forEach((listener) => listener());
    },

    subscribe(listener: TransformListener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};
