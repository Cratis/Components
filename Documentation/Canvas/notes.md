# Notes

`Note` is a draggable, resizable, editable sticky note. Like every shape in this module it is presentational and fully controlled — it owns no position, size, or text of its own. It reads its `note` prop fresh every render and reports every change through callbacks; committing the change back into state is entirely up to the host.

`Note` positions its own body but not itself on the board — place it inside a `CanvasItem` at the same `x`/`y` as its data so the two stay in sync:

```tsx
import { useState } from 'react';
import { Canvas, CanvasItem } from '@cratis/components/Canvas';
import { Note, type NoteData } from '@cratis/components/Canvas';

function Board() {
    const [notes, setNotes] = useState<NoteData[]>([
        { id: '1', x: 40, y: 40, width: 200, height: 140, text: 'Welcome to the board!' },
    ]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const updateNote = (id: string, changes: Partial<NoteData>) =>
        setNotes(current => current.map(note => (note.id === id ? { ...note, ...changes } : note)));

    return (
        <Canvas>
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
    );
}
```

## `NoteData`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifies the note across renders |
| `x` / `y` | `number` | World-space position |
| `width` / `height` | `number` | Size in world-space units |
| `text` | `string` | The note's content |

## Props and callbacks

| Prop | Description |
|---|---|
| `note: NoteData` | The note to render |
| `selected: boolean` | Whether the note shows its selection outline and resize handles |
| `onSelect(id, additive)` | The note was clicked/pressed. `additive` is true when the gesture carried a shift/meta/ctrl modifier, for a host that supports multi-select |
| `onMove(id, x, y)` | Fired continuously while dragging |
| `onMoveEnd?(id)` | Fired once when a drag ends |
| `onResize(id, x, y, width, height)` | Fired continuously while resizing from any of the eight handles |
| `onResizeEnd?(id)` | Fired once when a resize ends |
| `onTextChange(id, text)` | Fired when the note's text is committed (on blur, after double-click enters edit mode) |
| `onExpandedChange?(id, isExpanded)` | Fired when the note grows to show its full text, or shrinks back — see below |

A host slow to feed an updated `note` back after a callback will see the note spring back to its last known value, the same trade-off `Region` makes for its own drag/resize/rename.

## Auto-fitting text

A note's font size is not fixed — `Note` measures its text against an off-screen mirror element and binary-searches for the largest size (up to 120px) that still fits the note's current `width`/`height`, shrinking as low as 4px before giving up. Because notes live on a canvas that zooms, text too small to read at 1:1 is often still legible one zoom step in, so shrinking is preferred over hiding content.

## "See full text"

When even the smallest readable size can't fit the text, `Note` shows a small expand button (a "+") in the corner instead of clipping the text. Clicking it grows the note to a height that shows everything, without changing its stored `width`/`height` — the grown state is a hover-like look, not a persisted resize, and falls back to the note's real size the moment the pointer leaves it (or the text is edited/resized back to fitting again).

Because an expanded note visually reaches over whatever sits below it, `onExpandedChange` tells the host when this happens so it can raise the note above its siblings for that duration — `Note` renders inside its own stacking context via `CanvasItem`'s `transform`, so it cannot raise itself above a *different* item on its own; see the `zIndex` note in [Basic Usage](basic-usage.md).

## Opt-in messaging

Committing an edit (the same moment `onTextChange` fires) also publishes a `NoteTextChanged` (carrying `noteId` and the full committed `text`) over the `@cratis/arc.react` messenger — no extra prop needed, since `note.id` is already there. `onTextChange` remains the note's primary contract; see [Messaging](messaging.md) for the full catalog and why this is silently inert without Arc.
