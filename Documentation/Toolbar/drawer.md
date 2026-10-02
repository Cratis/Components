---
title: Headed drawer
description: Present a category of tools as a headed drawer of labeled tiles, and let the consumer own what a tile does.
---

Set `presentation='drawer'` on a `ToolbarFolder` to open a headed drawer instead of the compact popout. The drawer shows a visible heading with a close button, followed by labeled tiles: a prominent icon and a title that is always visible, never only a tooltip. The default presentation, the icon-only grid and the labeled list keep working exactly as before.

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

The drawer presents a palette and nothing else. It does not know what a tile creates, where it goes, or whether a drop target accepts it.

- **The catalogue is yours.** `items` is data. Stack, Row, Grid and Container above are examples, not a built-in list. Add a type by adding an item; nothing inside the drawer changes. Items are rendered in the order supplied and are never normalized, filtered or mapped to a known type.
- **`payload` is opaque.** The exact value you supply is delivered unchanged to `onActivate` and to the drag callbacks. Identity lives in `id`, never in `title`.
- **You decide the target.** Activation by click, Enter or Space calls `onActivate(item)`. The drawer does not insert anything.
- **You own the drop.** Dragging a tile serializes `payload` with `JSON.stringify` onto the `application/json` entry of the HTML5 `DataTransfer` with `effectAllowed` set to `copy`, the same contract as [drag and drop](drag-and-drop.md). Your surface handles `dragover` and `drop`.

```tsx
<div
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => {
        event.preventDefault();
        insertAt(event.clientX, event.clientY, JSON.parse(event.dataTransfer.getData('application/json')));
    }}
/>
```

Because the transfer is JSON, keep payloads serializable. When you need the original object, `onItemDragStart(item, event)` receives the item with the very same `payload` reference.

## Items and children

`items` and `children` can be used together. Catalogue tiles come first. A `ToolbarButton` placed inside a drawer folder renders as a labeled tile too, using its `title`, `icon`, `data` and `draggable`.

| Prop | Purpose |
|---|---|
| `items` | Catalogue of `{ id, title, icon, payload, disabled?, disabledReason? }`. |
| `heading` | Visible heading. Defaults to `title`, which stays the trigger's accessible name. |
| `closeLabel` | Accessible name of the close button. Defaults to `messages.toolbar.closeDrawer`, then `Close`. |
| `onActivate` | Called with the item on click, Enter or Space. |
| `onItemDragStart` / `onItemDragEnd` | Called with the item when a tile drag starts and ends. |
| `draggable` | Whether catalogue tiles can be dragged. Defaults to `true`. |
| `closeOnInsert` | Close the drawer after an activation or a completed drop. Defaults to `false`. |
| `maxColumns` | Upper bound for the tile columns. Defaults to `3` in the drawer. |

## Unavailable items

Set `disabled` and give a `disabledReason` for an item the current context does not allow. The tile stays focusable and exposes `aria-disabled`, so keyboard and screen reader users can read why it is unavailable. The reason is also its native tooltip and its accessible description. A disabled tile neither activates nor drags.

## Dismissal, focus and drags

- The trigger exposes `aria-expanded` and `aria-controls`. The panel is named by the visible heading through `aria-labelledby`.
- Escape and the close button close the drawer and return focus to the trigger. A press outside the drawer closes it without restoring focus and without activating anything; the drawer reacts to `pointerdown`, so touch and pen behave like the mouse.
- Opening or closing the drawer never activates an item.
- The drawer stays open while a tile is dragged. It marks itself with `data-dragging`. A cancelled drag leaves everything as it was; with `closeOnInsert`, only a completed drop closes the drawer.
- Native HTML5 drag-and-drop is not available on every touch browser. Click activation is the equivalent insertion path, which is why `onActivate` exists.

## Placement

The drawer opens beside a vertical toolbar, towards `folderDirection`, and below a horizontal toolbar. It flips to the opposite side when the preferred side does not leave room, slides along the edge to stay inside the viewport, and when it is still too large it is bounded by the viewport and scrolls. Placement is recomputed each time the drawer opens and when the window is resized.

## Long and localized titles

Tile titles wrap and clamp to two lines. The full title remains the tile's accessible name, so a narrow drawer or a long translation never hides the essential label. Pass localized strings for `title`, `heading` and `closeLabel`.

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
