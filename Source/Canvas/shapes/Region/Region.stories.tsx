// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Canvas } from '../../Canvas';
import { CanvasItem } from '../../CanvasItem';
import { Note } from '../Note';
import type { NoteData } from '../Note';
import { Region } from './Region';
import type { RegionData } from './Region';

const meta: Meta<typeof Region> = {
    title: 'Canvas/Region',
    component: Region,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;

type Story = StoryObj<typeof Region>;

/**
 * Two draggable, resizable, renamable regions on a board. One nests a `Note` as its `children` — the
 * note's `x`/`y` are in the region's own coordinate space (relative to the region's top-left), and it
 * moves along with the region when the region is dragged only because it is rendered inside the same
 * `CanvasItem`. `Region` itself performs no containment or membership tracking: nothing here computes
 * "is this note inside this region" — the note happens to be nested because the host chose to render
 * it there, which is exactly the design boundary described in the documentation.
 */
export const Board: Story = {
    render: () => {
        const BoardDemo = () => {
            const [regionA, setRegionA] = useState<RegionData>({ id: 'a', x: 60, y: 60, width: 420, height: 300, name: 'Sprint board' });
            const [regionB, setRegionB] = useState<RegionData>({ id: 'b', x: 560, y: 120, width: 280, height: 180, name: 'Parking lot' });
            const [selectedId, setSelectedId] = useState<string | null>(null);

            const [note, setNote] = useState<NoteData>({ id: 'n1', x: 30, y: 60, width: 180, height: 120, text: 'Nested inside the region — try dragging it around within the region, or dragging the region itself.' });
            const [noteSelected, setNoteSelected] = useState(false);

            return (
                <div style={{ width: '100vw', height: '100vh' }} onPointerDown={() => { setSelectedId(null); setNoteSelected(false); }}>
                    <Canvas showControls>
                        <CanvasItem x={regionA.x} y={regionA.y}>
                            <Region
                                region={regionA}
                                selected={selectedId === regionA.id}
                                onSelect={id => setSelectedId(id)}
                                onMove={(id, x, y) => setRegionA(current => ({ ...current, x, y }))}
                                onResize={(id, x, y, width, height) => setRegionA(current => ({ ...current, x, y, width, height }))}
                                onNameChange={(id, name) => setRegionA(current => ({ ...current, name }))}
                            >
                                <div style={{ position: 'absolute', left: note.x, top: note.y }}>
                                    <Note
                                        note={note}
                                        selected={noteSelected}
                                        onSelect={() => setNoteSelected(true)}
                                        onMove={(id, x, y) => setNote(current => ({ ...current, x, y }))}
                                        onResize={(id, x, y, width, height) => setNote(current => ({ ...current, x, y, width, height }))}
                                        onTextChange={(id, text) => setNote(current => ({ ...current, text }))}
                                    />
                                </div>
                            </Region>
                        </CanvasItem>

                        <CanvasItem x={regionB.x} y={regionB.y}>
                            <Region
                                region={regionB}
                                selected={selectedId === regionB.id}
                                onSelect={id => setSelectedId(id)}
                                onMove={(id, x, y) => setRegionB(current => ({ ...current, x, y }))}
                                onResize={(id, x, y, width, height) => setRegionB(current => ({ ...current, x, y, width, height }))}
                                onNameChange={(id, name) => setRegionB(current => ({ ...current, name }))}
                            />
                        </CanvasItem>
                    </Canvas>
                </div>
            );
        };

        return <BoardDemo />;
    },
};
