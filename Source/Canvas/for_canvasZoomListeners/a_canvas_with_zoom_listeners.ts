// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import { attachCanvasZoomListeners } from '../canvasZoomListeners';
import type { PointerPosition } from '../pinchGesture';

/** A 400x300 canvas at (100, 50) in the viewport with the zoom listeners attached. */
export class CanvasWithZoomListeners {
    readonly container = document.createElement('div');
    readonly sibling = document.createElement('div');
    readonly touchPointers = new Map<number, PointerPosition>();
    readonly zoomTowards = vi.fn<(focusX: number, focusY: number, factor: number) => void>();
    pan = { x: 0, y: 0 };
    private readonly detach: () => void;

    constructor() {
        document.body.append(this.container, this.sibling);
        this.container.getBoundingClientRect = () => new DOMRect(100, 50, 400, 300);

        this.detach = attachCanvasZoomListeners({
            container: this.container,
            cancelMomentum: () => undefined,
            getPan: () => this.pan,
            setPan: pan => {
                this.pan = pan;
            },
            touchPointers: this.touchPointers,
            zoomTowards: this.zoomTowards,
            noteGestureActivity: () => undefined,
            scheduleTransformApply: () => undefined,
        });
    }

    dispose() {
        this.detach();
        this.container.remove();
        this.sibling.remove();
    }

    /** Dispatches a wheel event and returns it so the spec can inspect `defaultPrevented`. */
    wheel(target: EventTarget, init: WheelEventInit): WheelEvent {
        const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
        target.dispatchEvent(event);
        return event;
    }

    /** Dispatches a Safari gesture event; clientX/clientY are omitted to mimic iPadOS. */
    gesture(
        target: EventTarget,
        type: 'gesturestart' | 'gesturechange' | 'gestureend',
        scale: number,
        position?: PointerPosition,
    ): Event {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.assign(event, { scale }, position && { clientX: position.x, clientY: position.y });
        target.dispatchEvent(event);
        return event;
    }
}
