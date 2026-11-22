// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, type PointerEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { useCanvasPointerGestures, type CanvasPointerGesturesOptions } from '../../useCanvasPointerGestures';
import type { PointerPosition } from '../../pinchGesture';

export interface PointerInit {
    pointerType?: string;
    pointerId?: number;
    button?: number;
    clientX?: number;
    clientY?: number;
    target?: EventTarget | null;
}

/** Mounts {@link useCanvasPointerGestures} with recorded camera operations, a manual frame queue and clock. */
export class a_pointer_gesture_surface {
    container = document.createElement('div');
    animationFrameRef = { current: null as number | null };
    panRef = { current: { x: 10, y: 20 } };
    zoomRef = { current: 1 };
    touchPointersRef = { current: new Map<number, PointerPosition>() };
    calls: string[] = [];
    frames = new Map<number, FrameRequestCallback>();
    cancelledFrames: number[] = [];
    capturedPointers: number[] = [];
    now = 0;
    handlers!: ReturnType<typeof useCanvasPointerGestures>;
    private nextFrame = 1;
    private host = document.createElement('div');
    private root: Root = createRoot(this.host);

    constructor(overrides: Partial<Pick<CanvasPointerGesturesOptions, 'readOnly' | 'backgroundDragPans' | 'minZoom' | 'maxZoom'>> = {}) {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            const id = this.nextFrame++;
            this.frames.set(id, callback);
            return id;
        });
        vi.stubGlobal('cancelAnimationFrame', (id: number) => {
            this.cancelledFrames.push(id);
            this.frames.delete(id);
        });
        vi.spyOn(performance, 'now').mockImplementation(() => this.now);

        const record = (name: string) => () => { this.calls.push(name); };
        const options: CanvasPointerGesturesOptions = {
            containerRef: { current: this.container },
            animationFrameRef: this.animationFrameRef,
            panRef: this.panRef,
            zoomRef: this.zoomRef,
            touchPointersRef: this.touchPointersRef,
            minZoom: overrides.minZoom ?? 0.1,
            maxZoom: overrides.maxZoom ?? 4,
            readOnly: overrides.readOnly ?? false,
            backgroundDragPans: overrides.backgroundDragPans ?? true,
            applyWorldTransform: record('applyWorldTransform'),
            refreshMinimap: record('refreshMinimap'),
            render: record('render'),
            noteGestureActivity: record('noteGestureActivity'),
            scheduleTransformApply: record('scheduleTransformApply'),
        };
        const Probe = () => {
            this.handlers = useCanvasPointerGestures(options);
            return null;
        };
        act(() => this.root.render(<Probe />));
    }

    event(init: PointerInit = {}) {
        return {
            pointerType: init.pointerType ?? 'mouse',
            pointerId: init.pointerId ?? 1,
            button: init.button ?? 0,
            clientX: init.clientX ?? 0,
            clientY: init.clientY ?? 0,
            target: init.target === undefined ? this.container : init.target,
            currentTarget: { setPointerCapture: (id: number) => this.capturedPointers.push(id) },
            preventDefault: vi.fn(),
        };
    }

    down(event: ReturnType<a_pointer_gesture_surface['event']>) {
        this.handlers.handlePointerDown(event as unknown as PointerEvent<HTMLDivElement>);
        return event;
    }

    move(init: PointerInit) {
        this.handlers.handlePointerMove(this.event(init) as unknown as PointerEvent<HTMLDivElement>);
    }

    up(init: PointerInit) {
        this.handlers.handlePointerUp(this.event(init) as unknown as PointerEvent<HTMLDivElement>);
    }

    touch(pointerId: number, clientX: number, clientY: number) {
        return this.event({ pointerType: 'touch', pointerId, clientX, clientY, target: null });
    }

    runFrame(time: number) {
        const [id, callback] = [...this.frames.entries()][0];
        this.frames.delete(id);
        callback(time);
    }

    unmount() {
        act(() => this.root.unmount());
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    }
}
