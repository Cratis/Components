// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, StrictMode, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { usePivotStage } from '../components/pivot/usePivotStage';
import type { PivotStage } from '../components/pivot/PivotStage';

const pixi = vi.hoisted(() => {
    const applications: Application[] = [];
    class Application {
        canvas = document.createElement('canvas');
        stage = { addChild: vi.fn(), on: vi.fn() };
        renderer = { resize: vi.fn(), render: vi.fn() };
        resolveInit!: () => void;
        init = vi.fn(() => new Promise<void>(resolve => { this.resolveInit = resolve; }));
        destroy = vi.fn();

        constructor() {
            applications.push(this);
        }
    }
    return { Application, applications };
});

vi.mock('pixi.js', () => ({
    Application: pixi.Application,
    Container: class {},
    Rectangle: class {},
}));
vi.mock('../components/pivot/sprites', () => ({ clearSpritePool: vi.fn() }));

let host: HTMLDivElement;
let root: Root;
let stage: PivotStage;

function Sample() {
    const parentContainerRef = useRef<HTMLDivElement>(null);
    const needsRenderRef = useRef(false);
    const onPanStartRef = useRef(() => undefined);
    const onPanMoveRef = useRef(() => undefined);
    const onPanEndRef = useRef(() => undefined);
    stage = usePivotStage({
        parentContainerRef, viewportWidth: 800, viewportHeight: 600,
        needsRenderRef, onPanStartRef, onPanMoveRef, onPanEndRef,
    });
    return <div ref={parentContainerRef} />;
}

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class {
        observe() { return undefined; }
        disconnect() { return undefined; }
    });
    pixi.applications.length = 0;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
});

const resolveInitializations = async () => {
    await act(async () => {
        pixi.applications.forEach(app => app.resolveInit());
    });
};

const shouldDestroyEveryApplication = () => {
    pixi.applications.forEach(app => {
        app.destroy.mock.calls.should.deep.equal([[true, { children: true }]]);
        app.canvas.isConnected.should.equal(false);
    });
    host.querySelectorAll('canvas').length.should.equal(0);
};

describe('when initialization is replayed by StrictMode', () => {
    it('should destroy every application when initialization resolves before unmount', async () => {
        await act(async () => root.render(<StrictMode><Sample /></StrictMode>));
        pixi.applications.length.should.equal(2);
        await resolveInitializations();

        host.querySelectorAll('canvas').length.should.equal(1);
        stage.pixiReady.should.equal(true);
        stage.appRef.current!.should.equal(pixi.applications.at(-1));
        await act(async () => root.unmount());

        shouldDestroyEveryApplication();
    });

    it('should destroy every application when unmounted before initialization resolves', async () => {
        await act(async () => root.render(<StrictMode><Sample /></StrictMode>));
        pixi.applications.length.should.equal(2);
        await act(async () => root.unmount());
        pixi.applications.forEach(app => app.destroy.mock.calls.length.should.equal(0));

        await resolveInitializations();

        shouldDestroyEveryApplication();
    });
});

describe('when initializing without StrictMode', () => {
    it('should destroy the application on ordinary unmount', async () => {
        await act(async () => root.render(<Sample />));
        await resolveInitializations();
        pixi.applications.length.should.equal(1);
        host.querySelectorAll('canvas').length.should.equal(1);
        await act(async () => root.unmount());

        shouldDestroyEveryApplication();
    });
});
