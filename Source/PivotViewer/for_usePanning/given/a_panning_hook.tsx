// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { usePanning } from '../../hooks/usePanning';

export interface FakeContainer {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
}

export interface PanEventInit {
    button?: number;
    altKey?: boolean;
    clientX?: number;
    clientY?: number;
    onCard?: boolean;
}

/** Mounts {@link usePanning} against a fake scroll container with a manual frame queue and clock. */
export class a_panning_hook {
    container: FakeContainer = { scrollLeft: 50, scrollTop: 20, scrollWidth: 1000, scrollHeight: 600, clientWidth: 200, clientHeight: 100 };
    onBackgroundClick = vi.fn();
    onScrollChange = vi.fn();
    frames = new Map<number, FrameRequestCallback>();
    cancelledFrames: number[] = [];
    now = 0;
    result!: ReturnType<typeof usePanning>;
    private nextFrame = 1;
    private host = document.createElement('div');
    private root: Root = createRoot(this.host);

    constructor(withCallbacks = true) {
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

        const containerRef = { current: this.container as unknown as HTMLDivElement };
        const onBackgroundClick = withCallbacks ? this.onBackgroundClick : undefined;
        const onScrollChange = withCallbacks ? this.onScrollChange : undefined;
        const Probe = () => {
            this.result = usePanning(containerRef, onBackgroundClick, onScrollChange);
            return null;
        };
        act(() => this.root.render(<Probe />));
    }

    event(init: PanEventInit = {}) {
        const target = document.createElement('div');
        if (init.onCard) target.className = 'pv-card';
        return {
            button: init.button ?? 0,
            altKey: init.altKey ?? false,
            clientX: init.clientX ?? 0,
            clientY: init.clientY ?? 0,
            target,
            preventDefault: vi.fn(),
        };
    }

    start(event: ReturnType<a_panning_hook['event']>, isExplicitlyOnCard?: boolean) {
        act(() => this.result.handlePanStart(event as unknown as React.MouseEvent, isExplicitlyOnCard));
    }

    move(clientX: number, clientY: number) {
        act(() => this.result.handlePanMove({ clientX, clientY } as unknown as React.MouseEvent));
    }

    end() {
        act(() => this.result.handlePanEnd());
    }

    runFrame() {
        const [id, callback] = [...this.frames.entries()][0];
        this.frames.delete(id);
        callback(this.now);
    }

    unmount() {
        act(() => this.root.unmount());
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    }
}
