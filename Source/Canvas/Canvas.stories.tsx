// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Canvas, type CanvasHandle } from './Canvas';
import { CanvasItem } from './CanvasItem';

const meta: Meta<typeof Canvas> = {
    title: 'Canvas/Canvas',
    component: Canvas,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;

type Story = StoryObj<typeof Canvas>;

const BOX_COLORS = ['#2563eb', '#be185d', '#047857', '#b45309', '#6d28d9'];

interface DragState {
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    zoom: number;
}

/**
 * A plain styled `<div>` positioned by `CanvasItem` and made draggable by hand — there is nothing
 * "canvas-aware" about the box itself, which is the point: dragging is board-level logic the engine
 * does not provide on its own (that's what `Note`/`Region` build on top of it).
 */
const DraggableBox = ({ label, color, x, y, onMove }: { label: string; color: string; x: number; y: number; onMove: (x: number, y: number) => void }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const width = 140;

    const readEffectiveZoom = (): number => {
        const renderedWidth = boxRef.current?.getBoundingClientRect().width;
        return renderedWidth && renderedWidth > 0 ? renderedWidth / width : 1;
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        dragRef.current = { clientX: event.clientX, clientY: event.clientY, startX: x, startY: y, zoom: readEffectiveZoom() };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!dragRef.current || !event.buttons) return;
        const { clientX, clientY, startX, startY, zoom } = dragRef.current;
        onMove(startX + (event.clientX - clientX) / zoom, startY + (event.clientY - clientY) / zoom);
    };

    const handlePointerUp = () => { dragRef.current = null; };

    return (
        <CanvasItem x={x} y={y}>
            <div
                ref={boxRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    width,
                    height: 90,
                    borderRadius: 10,
                    background: color,
                    color: 'white',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                }}
            >
                {label}
            </div>
        </CanvasItem>
    );
};

/**
 * The engine on its own, independent of the shape components: a handful of plain `<div>`s made
 * draggable with a few lines of pointer-event handling, positioned by `CanvasItem`. Scroll/trackpad to
 * pan, hold `Ctrl`/`Cmd` and scroll to zoom, or drag a box to move it.
 */
export const DeclarativeChildren: Story = {
    render: () => {
        const DeclarativeChildrenDemo = () => {
            const [boxes, setBoxes] = useState([
                { id: 'a', label: 'Select', color: BOX_COLORS[0], x: 40, y: 40 },
                { id: 'b', label: 'Draw', color: BOX_COLORS[1], x: 260, y: 120 },
                { id: 'c', label: 'Ship it', color: BOX_COLORS[2], x: 120, y: 300 },
                { id: 'd', label: 'Review', color: BOX_COLORS[3], x: 420, y: 280 },
            ]);

            const moveBox = (id: string, x: number, y: number) =>
                setBoxes(current => current.map(box => (box.id === id ? { ...box, x, y } : box)));

            return (
                <div style={{ width: '100vw', height: '100vh' }}>
                    <Canvas showControls>
                        {boxes.map(box => (
                            <DraggableBox key={box.id} label={box.label} color={box.color} x={box.x} y={box.y} onMove={(x, y) => moveBox(box.id, x, y)} />
                        ))}
                    </Canvas>
                </div>
            );
        };

        return <DeclarativeChildrenDemo />;
    },
};

/**
 * `showControls` and `showMinimap` together, with enough items scattered across a wide area that
 * panning around — and the minimap's own click/drag-to-pan — are actually meaningful. Open the minimap
 * from the controls pill (bottom-left) to jump around the board.
 */
export const LocalizedControls: Story = {
    render: () => (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas
                showControls
                showMinimap
                controlsLabels={{
                    toggleMinimap: 'Vis eller skjul minikart',
                    zoomOut: 'Zoom ut',
                    resetZoom: 'Tilbakestill zoom',
                    zoomIn: 'Zoom inn',
                    help: 'Hjelp',
                }}
            />
        </div>
    ),
};

export const WithControlsAndMinimap: Story = {
    render: () => {
        const WithControlsAndMinimapDemo = () => {
            const scattered = [
                { id: '1', label: 'Idea', color: BOX_COLORS[0], x: 0, y: 0 },
                { id: '2', label: 'Sketch', color: BOX_COLORS[1], x: 380, y: -160 },
                { id: '3', label: 'Prototype', color: BOX_COLORS[2], x: 760, y: 40 },
                { id: '4', label: 'Feedback', color: BOX_COLORS[3], x: 220, y: 360 },
                { id: '5', label: 'Iterate', color: BOX_COLORS[4], x: 620, y: 420 },
                { id: '6', label: 'Build', color: BOX_COLORS[0], x: 1080, y: 260 },
                { id: '7', label: 'Test', color: BOX_COLORS[1], x: 980, y: -140 },
                { id: '8', label: 'Ship', color: BOX_COLORS[2], x: 1400, y: 60 },
            ];
            const [boxes, setBoxes] = useState(scattered);

            const moveBox = (id: string, x: number, y: number) =>
                setBoxes(current => current.map(box => (box.id === id ? { ...box, x, y } : box)));

            return (
                <div style={{ width: '100vw', height: '100vh' }}>
                    <Canvas
                        showControls
                        showMinimap
                        initialZoom={0.6}
                        minimapWorldWidth={2000}
                        minimapWorldHeight={1200}
                    >
                        {boxes.map(box => (
                            <DraggableBox key={box.id} label={box.label} color={box.color} x={box.x} y={box.y} onMove={(x, y) => moveBox(box.id, x, y)} />
                        ))}
                    </Canvas>
                </div>
            );
        };

        return <WithControlsAndMinimapDemo />;
    },
};

/** The camera reported by `onTransformChange`, written where a test can read it. */
const CameraReadout = ({ zoom, pan }: { zoom: number; pan: { x: number; y: number } }) => (
    <output
        data-testid='camera'
        data-zoom={zoom.toFixed(4)}
        data-pan-x={pan.x.toFixed(2)}
        data-pan-y={pan.y.toFixed(2)}
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, font: '12px monospace', background: 'white', padding: 4 }}
    >
        zoom {zoom.toFixed(2)} · pan {pan.x.toFixed(0)}, {pan.y.toFixed(0)}
    </output>
);

/**
 * The camera driven through every input path: wheel pan, Ctrl+wheel zoom toward the pointer, a
 * background drag, the zoom controls, and the imperative handle. The readout shows what
 * `onTransformChange` reports.
 */
export const CameraInteractions: Story = {
    render: () => {
        const CameraInteractionsDemo = () => {
            const [camera, setCamera] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
            const handleRef = useRef<CanvasHandle | null>(null);
            return (
                <div style={{ width: 800, height: 600, position: 'relative' }}>
                    <Canvas
                        showControls
                        onTransformChange={(zoom, pan) => setCamera({ zoom, pan: { ...pan } })}
                        onHandleReady={(handle) => { handleRef.current = handle; }}
                        style={{ width: 800, height: 600 }}
                    >
                        <CanvasItem id='sample' x={100} y={50}>
                            <div style={{ width: 120, height: 60, background: BOX_COLORS[0], color: 'white' }}>Sample</div>
                        </CanvasItem>
                    </Canvas>
                    <CameraReadout zoom={camera.zoom} pan={camera.pan} />
                    <button type='button' style={{ position: 'absolute', top: 40, right: 8, zIndex: 10 }} onClick={() => handleRef.current?.smoothPanToWorld(0, 0, 1)}>
                        Center origin
                    </button>
                    <output data-testid='bounds' style={{ position: 'absolute', top: 72, right: 8, zIndex: 10 }}>
                        <button type='button' onClick={(event) => {
                            event.currentTarget.parentElement!.dataset.bounds = JSON.stringify(handleRef.current?.getItemBounds() ?? []);
                        }}>
                            Read bounds
                        </button>
                    </output>
                </div>
            );
        };
        return <CameraInteractionsDemo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const surface = canvasElement.querySelector<HTMLElement>('.canvas-surface')!;
        const camera = () => canvas.getByTestId('camera');
        const expectCamera = async (zoom: number, panX: number, panY: number) => {
            await waitFor(() => {
                expect(Number(camera().dataset.zoom)).toBeCloseTo(zoom, 3);
                expect(Number(camera().dataset.panX)).toBeCloseTo(panX, 1);
                expect(Number(camera().dataset.panY)).toBeCloseTo(panY, 1);
            });
        };
        await waitFor(() => expect(surface.querySelector('canvas')).not.toBeNull());
        const rect = surface.getBoundingClientRect();

        // A plain wheel pans by the wheel delta.
        surface.dispatchEvent(new WheelEvent('wheel', { deltaX: 30, deltaY: 40, clientX: rect.left + 10, clientY: rect.top + 10, bubbles: true, cancelable: true }));
        await expectCamera(1, -30, -40);

        // Ctrl+wheel zooms toward the pointer, holding the world point under it still.
        const focusX = 200;
        const focusY = 100;
        surface.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, clientX: rect.left + focusX, clientY: rect.top + focusY, bubbles: true, cancelable: true }));
        const zoomed = Math.exp(100 * 0.008);
        await expectCamera(zoomed, focusX - (focusX + 30) * zoomed, focusY - (focusY + 40) * zoomed);

        // The zoom controls: reset returns to 100% and keeps the pan; zoom in scales around the center.
        const panX = Number(camera().dataset.panX);
        const panY = Number(camera().dataset.panY);
        canvas.getByRole('button', { name: 'Reset Zoom' }).click();
        await expectCamera(1, panX, panY);
        canvas.getByRole('button', { name: 'Zoom In' }).click();
        await expectCamera(1.2, 400 - (400 - panX) * 1.2, 300 - (300 - panY) * 1.2);
        canvas.getByRole('button', { name: 'Zoom Out' }).click();
        await expectCamera(1, panX, panY);

        // A mouse drag on the empty background pans by the drag distance.
        const pointer = { pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, bubbles: true, cancelable: true };
        const background = surface.querySelector('canvas')!;
        background.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, clientX: rect.left + 500, clientY: rect.top + 400 }));
        surface.dispatchEvent(new PointerEvent('pointermove', { ...pointer, clientX: rect.left + 520, clientY: rect.top + 430 }));
        surface.dispatchEvent(new PointerEvent('pointerup', { ...pointer, buttons: 0, clientX: rect.left + 520, clientY: rect.top + 430 }));
        await expectCamera(1, panX + 20, panY + 30);

        // The imperative handle centers a world point.
        canvas.getByRole('button', { name: 'Center origin' }).click();
        await expectCamera(1, 400, 300);

        // The handle reports the measured bounds of registered items.
        canvas.getByRole('button', { name: 'Read bounds' }).click();
        await waitFor(() => {
            const bounds = JSON.parse(canvas.getByTestId('bounds').dataset.bounds ?? '[]') as Array<{ x: number; y: number; width: number; height: number }>;
            expect(bounds).toEqual([{ x: 100, y: 50, width: 120, height: 60 }]);
        });
    },
};
