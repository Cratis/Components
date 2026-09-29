// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Treats the browser pointer event Pixi exposes as the React mouse event PivotViewer's pan
 * callbacks take; they read only the coordinates and modifiers both share.
 * @param event The originating browser event.
 * @returns The same event, typed for the pan callbacks.
 */
export const asReactMouseEvent = (event: unknown): React.MouseEvent => {
    // SAFETY: Pixi exposes the originating browser pointer event. PivotViewer's pan
    // callbacks consume only coordinates/modifiers shared with React.MouseEvent.
    return event as React.MouseEvent;
};
