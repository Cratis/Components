---
title: Toolbar drawer palettes
description: Present labeled tools in a ToolbarFolder drawer, connect activation and dragging to your application, and control dismissal and focus.
---

Use a `ToolbarFolder` drawer in Cratis Components when users need to browse a category of tools by name before choosing one. Set `presentation='drawer'` to show a heading, a close button, and tiles with visible icons and titles. Your application decides what choosing or dragging a tile does.

The example inserts a layout item at the current selection when a user clicks a tile or activates it with Enter or Space. The `items` array is your catalogue, not a built-in set of layout types.

```tsx
import { Toolbar, ToolbarFolder } from '@cratis/components/Toolbar';
import type { ToolbarDrawerItem } from '@cratis/components/Toolbar';

const layoutItems: ToolbarDrawerItem[] = [
    { id: 'stack', title: 'Stack', icon: <StackGlyph />, payload: { type: 'stack' } },
    { id: 'row', title: 'Row', icon: <RowGlyph />, payload: { type: 'row' } },
    { id: 'grid', title: 'Grid', icon: <GridGlyph />, payload: { type: 'grid', columns: 2 } },
    { id: 'container', title: 'Container', icon: <ContainerGlyph />, payload: { type: 'container' } },
];

<Toolbar aria-label='Editor tools'>
    <ToolbarFolder
        icon={<LayersGlyph />}
        title='Layout'
        presentation='drawer'
        items={layoutItems}
        onActivate={(item) => insertAtSelection(item.payload)}
    />
</Toolbar>
```

`StackGlyph`, `LayersGlyph` and `insertAtSelection` stand for your own icons and insertion logic.

## Palette presentation versus consumer-owned drop

The drawer presents the choices; your application performs the action. Items render in the order you supply them, without filtering or mapping to known types. Give each item a stable `id` for identity and a `title` for its label.

Activation calls `onActivate(item)` with your item and its unchanged `payload`. Use that handler to insert at the selection, choose a tool, or perform the action your editor supports. The drawer does not choose a target or insert anything itself.

Dragging uses a different handoff: it serializes `payload` with `JSON.stringify` into the `application/json` entry of the native HTML5 `DataTransfer` and sets `effectAllowed` to `copy`. Your surface must accept and handle the drop. This fragment shows that boundary:

```tsx
<div
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => {
        event.preventDefault();
        insertAt(event.clientX, event.clientY, JSON.parse(event.dataTransfer.getData('application/json')));
    }}
/>
```

Keep payloads JSON-serializable and validate incoming data before inserting it on a surface that also accepts other drops. The fragment assumes a valid palette payload; [Drag and drop](drag-and-drop.md) explains the transfer and target handlers. When you need the original object at drag start, `onItemDragStart(item, event)` receives the item with the same `payload` reference.

Keep `onActivate` available even when dragging is enabled. Native HTML5 dragging varies across touch browsers and does not provide a keyboard insertion path. Activation lets users perform the same task without dragging.

## Items and children

`items` and `children` can be used together. Catalogue tiles come first. A `ToolbarButton` placed inside a drawer folder renders as a labeled tile too, using its `title`, `icon`, `data` and `draggable`. Child buttons use their own `onClick` and `onDragStart`; the folder's catalogue callbacks and `closeOnInsert` behavior do not apply to them.

| Prop | Purpose |
|---|---|
| `items` | Catalogue of `{ id, title, icon, payload, disabled?, disabledReason? }`. |
| `heading` | Visible heading. Defaults to `title`, which stays the trigger's accessible name. |
| `closeLabel` | Accessible name of the close button. Defaults to `messages.toolbar.closeDrawer`, then `Close`. |
| `onActivate` | Called with the item on click, Enter or Space. |
| `onItemDragStart` / `onItemDragEnd` | Called with the item when a tile drag starts and ends. |
| `draggable` | Whether catalogue tiles can be dragged. Defaults to `true`. |
| `closeOnInsert` | Close after a catalogue tile activates or its drag ends with a non-`none` `dropEffect`. Defaults to `false`. |
| `maxColumns` | Upper bound for the tile columns. Defaults to `3` in the drawer. |

## Unavailable items

Set `disabled` and give a `disabledReason` for an item the current context does not allow. The tile stays focusable and exposes `aria-disabled`, so keyboard and screen reader users can read why it is unavailable. The reason is also its native tooltip and its accessible description. A disabled tile neither activates nor drags.

## Dismissal, focus and drags

Opening the drawer does not move focus into it or activate a tile. The trigger exposes `aria-expanded` and `aria-controls`; the visible heading names the panel through `aria-labelledby`. When closed, the panel is `inert` and `aria-hidden`.

Escape and the close button close the drawer and return focus to the trigger. Pressing outside closes it without restoring focus or activating a tile. Outside dismissal listens to `pointerdown` as well as `mousedown`, so it also handles touch and pen presses. Clicking the trigger again closes the drawer too.

A tile drag does not itself dismiss the drawer, which marks the drag with `data-dragging`. With `closeOnInsert={true}`, catalogue activation closes it and restores trigger focus. A catalogue drag closes it without restoring focus only when the drag ends with a `dropEffect` other than `'none'`; cancellation leaves it open. This browser drop signal does not confirm that your application successfully inserted anything.

## Placement

The drawer opens beside a vertical toolbar, towards `folderDirection`, and below a horizontal toolbar. It flips to the opposite side when the preferred side does not leave room, slides along the edge to stay inside the viewport, and when it is still too large it is bounded by the viewport and scrolls. Placement is recomputed each time the drawer opens and when the window is resized.

## Long and localized titles

Tile titles wrap and clamp to two lines. The full title remains the tile's accessible name, although longer text can be visually clipped. Pass localized strings for `title`, `heading` and `closeLabel`.

## Styling parts

| `pt` key | `data-cratis-part` | Element |
|---|---|---|
| `drawerHeader` | `toolbar-folder-header` | Header row. |
| `drawerTitle` | `toolbar-folder-title` | Visible heading. |
| `drawerClose` | `toolbar-folder-close` | Native close button. |
| `tile` | `toolbar-folder-tile` | Each tile rendered from `items`. |
| `tileIcon` | `toolbar-folder-tile-icon` | Icon wrapper inside a tile. |
| `tileLabel` | `toolbar-folder-tile-label` | Label inside a tile. |

`ToolbarButton` children render the same tile parts; their own `pt.root`, `pt.icon` and `pt.label` attributes apply to them. A disabled tile carries `data-disabled`, and an active one `data-selected`.
