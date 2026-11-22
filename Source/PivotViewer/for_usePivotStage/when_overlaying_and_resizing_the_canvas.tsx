// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { usePivotStage } from '../components/pivot/usePivotStage';
import type { PivotStage } from '../components/pivot/PivotStage';

const pixi = vi.hoisted(() => {
    const applications: Application[] = [];
    class Rectangle {
        constructor(public x: number, public y: number, public width: number, public height: number) {}
    }
    class Application {
        canvas: HTMLCanvasElement | undefined = document.createElement('canvas');
        handlers = new Map<string, (event: { nativeEvent: unknown }) => void>();
        stage = {
            children: [] as unknown[],
            eventMode: '',
            hitArea: undefined as Rectangle | undefined,
            addChild: vi.fn((child: unknown) => { this.stage.children.push(child); }),
            on: vi.fn((name: string, handler: (event: { nativeEvent: unknown }) => void) => { this.handlers.set(name, handler); }),
        };
        renderer = { resize: vi.fn(), render: vi.fn() };
        options: unknown;
        init = vi.fn(async (options: unknown) => { this.options = options; });
        destroy = vi.fn();

        constructor() {
            if (pixi.withoutCanvas) this.canvas = undefined;
            applications.push(this);
        }
    }
    return { Application, Rectangle, applications, withoutCanvas: false };
});

vi.mock('pixi.js', () => ({
    Application: pixi.Application,
    Container: class {},
    Rectangle: pixi.Rectangle,
}));
vi.mock('../components/pivot/sprites', () => ({ clearSpritePool: vi.fn() }));

let host: HTMLDivElement;
let root: Root;
let stage: PivotStage;
let observed: Element[];
let resizeCallback: () => void;
const panStart = vi.fn();
const panMove = vi.fn();
const panEnd = vi.fn();

function Sample({ width, height }: { width: number; height: number }) {
    const parentContainerRef = useRef<HTMLDivElement>(null);
    const needsRenderRef = useRef(false);
    const onPanStartRef = useRef(panStart);
    const onPanMoveRef = useRef(panMove);
    const onPanEndRef = useRef(panEnd);
    stage = usePivotStage({
        parentContainerRef, viewportWidth: width, viewportHeight: height,
        needsRenderRef, onPanStartRef, onPanMoveRef, onPanEndRef,
    });
    return <div ref={parentContainerRef} />;
}

const mount = async (width: number, height: number) => {
    await act(async () => root.render(<Sample width={width} height={height} />));
    await act(async () => undefined);
    return pixi.applications[0];
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    observed = [];
    vi.stubGlobal('ResizeObserver', class {
        constructor(callback: () => void) { resizeCallback = callback; }
        observe(element: Element) { observed.push(element); }
        disconnect() { return undefined; }
    });
    pixi.applications.length = 0;
    pixi.withoutCanvas = false;
    panStart.mockClear();
    panMove.mockClear();
    panEnd.mockClear();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('when initializing with a viewport size', () => {
    it('should initialize a transparent application at that size', async () => {
        const app = await mount(640, 480);
        (app.options as { width: number; height: number; backgroundAlpha: number; autoStart: boolean }).should.include({
            width: 640, height: 480, backgroundAlpha: 0, autoStart: false,
        });
    });

    it('should overlay the canvas beside the viewport behind its scrollbars', async () => {
        const app = await mount(640, 480);
        const canvas = app.canvas!;
        (canvas.parentElement === host).should.equal(true);
        (stage.canvasRef.current === canvas).should.equal(true);
        canvas.style.position.should.equal('absolute');
        canvas.style.zIndex.should.equal('0');
        canvas.style.pointerEvents.should.equal('none');
        canvas.style.display.should.equal('block');
        canvas.style.left.should.equal('0px');
        canvas.style.width.should.equal('0px');
    });

    it('should add the group layer beneath the card layer and render once', async () => {
        const app = await mount(640, 480);
        app.stage.children.length.should.equal(2);
        stage.groupsContainerRef.current!.should.equal(app.stage.children[0]);
        stage.rootRef.current!.should.equal(app.stage.children[1]);
        app.renderer.render.mock.calls.should.deep.equal([[app.stage]]);
        stage.needsRenderRef.current.should.equal(true);
        stage.pixiReady.should.equal(true);
    });

    it('should make the whole viewport a hit area and size the renderer', async () => {
        const app = await mount(640, 480);
        app.stage.eventMode.should.equal('static');
        app.stage.hitArea!.should.deep.include({ x: 0, y: 0, width: 640, height: 480 });
        app.renderer.resize.mock.calls.should.deep.equal([[640, 480], [640, 480]]);
        observed.length.should.equal(1);
    });

    it('should forward background pointer input to the pan callbacks', async () => {
        const app = await mount(640, 480);
        const down = { clientX: 1 };
        const move = { clientX: 2 };
        app.handlers.get('pointerdown')!({ nativeEvent: down });
        app.handlers.get('globalpointermove')!({ nativeEvent: move });
        app.handlers.get('globalpointerup')!({ nativeEvent: {} });
        panStart.mock.calls.should.deep.equal([[down]]);
        panMove.mock.calls.should.deep.equal([[move]]);
        panEnd.mock.calls.length.should.equal(1);
    });
});

describe('when initializing without a viewport size', () => {
    it('should fall back to a default size and skip sizing the renderer', async () => {
        const app = await mount(0, 0);
        (app.options as { width: number; height: number }).should.include({ width: 800, height: 600 });
        app.renderer.resize.mock.calls.length.should.equal(0);
        app.stage.hitArea!.should.deep.include({ width: 0, height: 0 });
    });
});

describe('when the application exposes no canvas', () => {
    it('should report it and still become ready', async () => {
        pixi.withoutCanvas = true;
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        await mount(640, 480);
        error.mock.calls[0][0].should.equal('PivotCanvas: Could not find canvas element from Pixi application');
        (stage.canvasRef.current === null).should.equal(true);
        stage.pixiReady.should.equal(true);
        error.mockRestore();
    });
});

describe('when the viewport size changes', () => {
    it('should resize the renderer and hit area immediately', async () => {
        const app = await mount(640, 480);
        await act(async () => root.render(<Sample width={320} height={200} />));
        app.renderer.resize.mock.calls.at(-1)!.should.deep.equal([320, 200]);
        app.stage.hitArea!.should.deep.include({ width: 320, height: 200 });
    });
});

describe('when the observed container resizes', () => {
    it('should resize once after the debounce delay', async () => {
        const app = await mount(640, 480);
        vi.useFakeTimers();
        const before = app.renderer.resize.mock.calls.length;
        resizeCallback();
        resizeCallback();
        vi.advanceTimersByTime(149);
        app.renderer.resize.mock.calls.length.should.equal(before);
        vi.advanceTimersByTime(1);
        app.renderer.resize.mock.calls.length.should.equal(before + 1);
    });
});
