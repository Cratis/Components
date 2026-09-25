---
title: Drag and drop
description: Let people drag toolbar tools onto a canvas or other drop surface.
---

Toolbar buttons can be dragged onto a canvas or other surface. This enables canvas-based applications to let users select tools by dragging them from the toolbar directly onto the work surface. Use the `draggable` prop either on individual `ToolbarButton` elements or on the `Toolbar` container itself to make every button draggable at once.

## Making All Buttons Draggable

Set `draggable` on the `Toolbar` to make every child `ToolbarButton` draggable. Use `onItemDragStart` to react when any button starts being dragged:

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

Use the `data` prop to attach any value to a button. This data is:

- Passed to `onDragStart` and `onItemDragStart` callbacks.
- Serialized with `JSON.stringify` as `application/json` onto the HTML5 `DataTransfer` object so the drop target can read it. A draggable button without `data` transfers the string `null`.

Dragging also sets `effectAllowed` to `copy`. The data must be JSON-serializable: functions and class instances do not survive the transfer.

## Handling the Drop on a Surface

Register a `drop` handler on the canvas or surface element and read the transferred data:

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

## Keyboard and pointer alternatives

Drag and drop uses native HTML5 dragging. Keyboard users cannot drag a tool, and touch support for HTML5 dragging varies by browser. Keep an `onClick` on every draggable button that does the same job, such as selecting the tool or placing it at a default position, so dragging is a shortcut rather than the only way in.
