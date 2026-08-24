// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Canvas } from '../../Canvas';
import { CanvasItem } from '../../CanvasItem';
import { Note } from './Note';
import type { NoteData } from './Note';

const meta: Meta<typeof Note> = {
    title: 'Canvas/Note',
    component: Note,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;

type Story = StoryObj<typeof Note>;

const initialNotes: NoteData[] = [
    { id: '1', x: 40, y: 40, width: 220, height: 160, text: 'Ideas for the kickoff meeting' },
    { id: '2', x: 320, y: 100, width: 160, height: 120, text: 'Ping Ada about the API contract' },
    { id: '3', x: 640, y: 60, width: 140, height: 140, text: 'Ship it 🚀' },
    {
        id: '4',
        x: 100,
        y: 300,
        width: 320,
        height: 190,
        text: 'This note carries a lot more text than the others — enough that it will not fit even at the smallest readable size. Notice the "+" button in the corner: hover it (or click it) to see the note grow and show everything, then move the pointer away to see it shrink back.',
    },
];

/**
 * A board of `Note`s wired to local state — draggable, resizable from any of the eight handles, and
 * editable with a double-click. Notes are sized differently on purpose: the small ones show the
 * auto-fitting font size at work, and the large one demonstrates the "see full text" expand affordance
 * once its text no longer fits even at the smallest readable size.
 */
export const Board: Story = {
    render: () => {
        const BoardDemo = () => {
            const [notes, setNotes] = useState<NoteData[]>(initialNotes);
            const [selectedId, setSelectedId] = useState<string | null>(null);

            const updateNote = (id: string, changes: Partial<NoteData>) =>
                setNotes(current => current.map(note => (note.id === id ? { ...note, ...changes } : note)));

            return (
                <div style={{ width: '100vw', height: '100vh' }} onPointerDown={() => setSelectedId(null)}>
                    <Canvas showControls>
                        {notes.map(note => (
                            <CanvasItem key={note.id} x={note.x} y={note.y}>
                                <Note
                                    note={note}
                                    selected={selectedId === note.id}
                                    onSelect={id => setSelectedId(id)}
                                    onMove={(id, x, y) => updateNote(id, { x, y })}
                                    onResize={(id, x, y, width, height) => updateNote(id, { x, y, width, height })}
                                    onTextChange={(id, text) => updateNote(id, { text })}
                                />
                            </CanvasItem>
                        ))}
                    </Canvas>
                </div>
            );
        };

        return <BoardDemo />;
    },
};
