# Regions

`Region` is a resizable, draggable, labeled box a host can place other shapes inside of — the generic shell behind a "group" or "area" affordance on a board. Like `Note`, it is presentational and fully controlled: it owns no position, size, or name state of its own, and reads its `region` prop fresh every render.

```tsx
import { useState } from 'react';
import { Canvas, CanvasItem } from '@cratis/components/Canvas';
import { Region, type RegionData } from '@cratis/components/Canvas';

function Board() {
    const [region, setRegion] = useState<RegionData>({
        id: 'planning', x: 40, y: 40, width: 400, height: 260, name: 'Planning',
    });
    const [selected, setSelected] = useState(false);

    return (
        <Canvas>
            <CanvasItem x={region.x} y={region.y}>
                <Region
                    region={region}
                    selected={selected}
                    onSelect={() => setSelected(true)}
                    onMove={(id, x, y) => setRegion(current => ({ ...current, x, y }))}
                    onResize={(id, x, y, width, height) => setRegion(current => ({ ...current, x, y, width, height }))}
                    onNameChange={(id, name) => setRegion(current => ({ ...current, name }))}
                />
            </CanvasItem>
        </Canvas>
    );
}
```

Only a drag started on the region's title bar moves it — a press on the region's body deliberately bubbles up to the host instead, so the same background can be swept for a rubber-band selection or clicked to select the region itself, rather than the region swallowing every gesture that lands on it.

## `RegionData`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Identifies the region across renders |
| `x` / `y` | `number` | World-space position |
| `width` / `height` | `number` | Size in world-space units |
| `name` | `string` | The label shown in the title bar |

## Props and callbacks

| Prop | Description |
|---|---|
| `region: RegionData` | The region to render |
| `selected: boolean` | Whether the region shows its selection outline and resize handles |
| `onSelect(id, additive)` | The title bar was clicked/pressed. `additive` reports a shift/meta/ctrl modifier, for multi-select |
| `onMove(id, x, y)` | Fired continuously while dragging from the title bar |
| `onMoveEnd?(id)` | Fired once when a drag ends |
| `onResize(id, x, y, width, height)` | Fired continuously while resizing from any of the eight handles |
| `onResizeEnd?(id)` | Fired once when a resize ends |
| `onNameChange(id, name)` | Fired when a rename is committed (double-click the title bar to rename) |
| `children?` | Rendered inside the region's own coordinate space, for visually nesting other shapes inside its bounds |

## `children` is visual nesting only — membership is detected and *reported*, never owned

`Region` renders its `children` positioned relative to its own top-left corner, so items placed at region-relative coordinates line up correctly inside it:

```tsx
<CanvasItem id={region.id} x={region.x} y={region.y}>
    <Region region={region} selected={false} onSelect={() => {}} onMove={() => {}} onResize={() => {}} onNameChange={() => {}}>
        {/* Rendered inside the region's own coordinate space */}
        <div style={{ position: 'absolute', left: 20, top: 40 }}>
            <Note note={noteInsideRegion} selected={false} onSelect={() => {}} onMove={() => {}} onResize={() => {}} onTextChange={() => {}} />
        </div>
    </Region>
</CanvasItem>
```

Rendering something as `children` does not make it a "member" — the two mechanisms are independent. What `Region` does do is detect containment: it watches the Canvas item registry, and whenever a sibling `CanvasItem` that carries an `id` gains or loses containment (its center point entering or leaving the region's bounds — whether the item moved, or the region was moved/resized over it), it publishes `ItemAddedToRegion` / `ItemRemovedFromRegion` over the `@cratis/arc.react` messenger. See [Messaging](messaging.md) for the full catalog and the opt-in rules; without an `ArcContext` above the `Canvas`, or for items without an `id`, this is silently inert.

Note the required convention in the snippet above: the `CanvasItem` wrapping a `Region` is given `id={region.id}`. That is how the region recognizes its own registry entry and excludes itself from its containment reports. Overlapping regions may each claim the same item — both publish an `ItemAddedToRegion` — and that is by design: resolving exclusivity is the host's call.

Detection is where it ends: `Region` still never moves members, persists nothing, and knows nothing about item types. It does not move contained items along with it when dragged or resized, and it holds no membership state a host could query. Deciding what membership *means*, storing it, rendering members as `children`, and keeping them moving together is board-level orchestration the host owns entirely. This is a deliberate design boundary, not a missing feature: a generic shell that reports what it sees is reusable in ways a shell with its own opinion about membership would not be.
