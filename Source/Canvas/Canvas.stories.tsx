// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Canvas } from './Canvas';
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
