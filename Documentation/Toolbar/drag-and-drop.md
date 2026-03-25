# Drag & Drop

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
    <ToolbarButton icon='pi pi-pencil' tooltip='Pencil' data={{ tool: 'pencil' }} />
    <ToolbarButton icon='pi pi-stop' tooltip='Rectangle' data={{ tool: 'rectangle' }} />
    <ToolbarButton icon='pi pi-circle' tooltip='Circle' data={{ tool: 'circle' }} />
</Toolbar>
```

## Making Individual Buttons Draggable

Set `draggable` and an optional `onDragStart` callback directly on a `ToolbarButton`:

```tsx
<Toolbar>
    <ToolbarButton
        icon='pi pi-pencil'
        tooltip='Pencil'
        draggable
        data={{ tool: 'pencil' }}
        onDragStart={(data, event) => {
            console.log('Pencil drag started', data);
        }}
    />
    <ToolbarButton icon='pi pi-undo' tooltip='Undo' />
</Toolbar>
```

## Associating Data with a Button

Use the `data` prop to attach any value to a button. This data is:

- Passed to `onDragStart` and `onItemDragStart` callbacks.
- Serialised as `application/json` onto the HTML5 `DataTransfer` object so the drop target can read it.

## Handling the Drop on a Surface

Register a `drop` handler on the canvas or surface element and read the transferred data:

```tsx
function Canvas() {
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('application/json');
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
