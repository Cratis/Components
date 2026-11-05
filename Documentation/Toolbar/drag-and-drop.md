---
title: Toolbar drag and drop
description: Transfer toolbar tool data to your canvas with native HTML5 drag and drop, while keeping click and keyboard activation available.
---

Cratis Components toolbar buttons can transfer tool data to a canvas through native HTML5 drag and drop. Your application handles the drop and decides what to create or select at that position. Make dragging a shortcut, not a requirement: provide activation that performs the same task without a drag.

## Making All Buttons Draggable

Set `draggable` on the `Toolbar` so child `ToolbarButton` elements inherit it. A button can opt out with `draggable={false}`, which is useful for actions such as Undo that have nothing to place on a canvas. Use `onItemDragStart` to receive drag starts from those buttons:

```tsx
<Toolbar
    draggable
    onItemDragStart={(data, event) => {
        console.log('Started dragging:', data);
    }}
>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Pencil' data={{ tool: 'pencil' }} />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' data={{ tool: 'rectangle' }} />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' data={{ tool: 'circle' }} />
</Toolbar>
```

## Making Individual Buttons Draggable

Set `draggable` and an optional `onDragStart` callback directly on a `ToolbarButton`:

```tsx
<Toolbar>
    <ToolbarButton
        icon={<span aria-hidden='true'>◆</span>}
        title='Pencil'
        draggable
        data={{ tool: 'pencil' }}
        onDragStart={(data, event) => {
            console.log('Pencil drag started', data);
        }}
    />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
</Toolbar>
```

## Associating Data with a Button

Use `data` to attach a payload to a button. The button's `onDragStart` runs before the toolbar's `onItemDragStart`; both receive the original value and the drag event.

The drop target receives a serialized copy, not that object reference. The button writes `JSON.stringify(data ?? null)` to the `application/json` entry of the HTML5 `DataTransfer` and sets `effectAllowed` to `copy`. A button without `data` transfers the string `null`. Use JSON-serializable data; functions and class behavior do not survive this transfer.

## Handling the Drop on a Surface

Allow drops by calling `preventDefault()` in the surface's `dragover` handler, then read the transferred JSON in its `drop` handler. The example logs the tool identifier; replace that line with your selection or insertion logic:

```tsx
function Canvas() {
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('application/json');
        if (!raw) return; // not a toolbar item, for example a dropped file
        const data = JSON.parse(raw) as { tool: string } | null;
        if (data) {
            console.log('Tool dropped:', data.tool);
        }
    };

    return (
        <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            style={{ width: 600, height: 400, border: '2px dashed #aaa' }}
        >
            Drop tools here
        </div>
    );
}
```

The type assertion in this example does not validate incoming data. If the surface accepts drops from elsewhere, handle malformed JSON and check the payload shape before using it. The toolbar transfers data but does not validate targets or perform insertion.

## Keyboard and pointer alternatives

Native HTML5 dragging does not provide keyboard dragging here, and touch support varies by browser. Give each draggable button an `onClick` that selects the tool or inserts at the current selection or a default position. Native button activation also supports Enter and Space, so users can complete the task without dragging.

For a data-driven palette, a [headed drawer](drawer.md) exposes `onActivate(item)` alongside its drag callbacks. Wire both paths to the same application operation, with the drop position supplied only by the drag path.
