# Pan & Zoom

## Input matrix

| Input | Effect |
|---|---|
| Mouse wheel / trackpad scroll | Pans the board |
| `Ctrl`/`Cmd` + wheel, or trackpad pinch | Zooms toward the cursor/gesture position |
| Left-button drag on empty background | Pans the board (mouse/pen) |
| Middle-button drag, anywhere | Pans the board |
| One-finger touch drag | Pans the board, with momentum on release |
| Two-finger touch pinch | Pans and zooms together around the pinch midpoint |

A left-button drag only pans when it starts on empty background — starting a drag on a `CanvasItem`'s content does not pan the board out from under it. Set `backgroundDragPans={false}` if your board wants to claim a plain left-drag for itself instead (for example, a rubber-band selection box); wheel/trackpad panning, middle-button-drag panning, and one-finger touch panning are unaffected by this and keep working, so a touch device is never left unable to move the board.

Safari/WebKit's non-standard trackpad gesture events are also handled, so pinch-to-zoom works there even though it never fires a `wheel` event with `ctrlKey` set the way Chrome/Firefox do.

## Zoom and pan props

```tsx
<Canvas
    initialZoom={1}
    initialPan={{ x: 0, y: 0 }}
    minZoom={0.1}
    maxZoom={5}
    onTransformChange={(zoom, pan) => console.log(zoom, pan)}
/>
```

- `initialZoom` (default `1`) / `initialPan` (default `{ x: 0, y: 0 }`) — the starting transform. As the names suggest, these are read once at mount: after the canvas has mounted, the pan/zoom is owned entirely by user gestures and the imperative APIs below, and further changes to these two props on a re-render do not move the camera. Use `onTransformChange` plus `CanvasHandle` if you need to drive the camera from outside.
- `minZoom` (default `0.1`) / `maxZoom` (default `5`) — clamps applied to every zoom gesture, including programmatic ones through `CanvasHandle`.
- `onTransformChange?: (zoom: number, pan: { x: number; y: number }) => void` — called after every applied transform frame (gesture or programmatic), for a host that mirrors the camera elsewhere (a zoom readout, persisted view state, ...).

## Controls and minimap

```tsx
<Canvas
    showControls
    showMinimap
    controlsPlacement='bottom-left'
/>
```

- `showControls` (default `true`) — renders the built-in `CanvasControls` zoom pill in the corner. See [Controls Chrome](controls-chrome.md) for its own props.
- `showMinimap` (default `false`) — adds a minimap toggle button to the controls; the minimap panel itself only mounts once opened.
- `controlsPlacement` (default `'bottom-left'`) — `'bottom-left'` or `'bottom-right'`.
- `minimapWorldWidth` / `minimapWorldHeight` — the world-space area the minimap represents. `CanvasMinimap` defaults these to `4000`×`3000` when omitted.
- `minimapItems` — explicit item boxes to draw on the minimap. When omitted, `Canvas` builds this list automatically from every mounted `CanvasItem`'s reported position and size, so the minimap works out of the box for the declarative-children approach without any extra wiring.

## `CanvasHandle` — imperative camera control

```tsx
import { useRef } from 'react';
import { Canvas, type CanvasHandle } from '@cratis/components/Canvas';

function ControlledBoard() {
    const handleRef = useRef<CanvasHandle | null>(null);

    return (
        <>
            <button onClick={() => handleRef.current?.smoothPanToWorld(400, 250)}>
                Go to item
            </button>
            <Canvas onHandleReady={handle => { handleRef.current = handle; }}>
                {/* ... */}
            </Canvas>
        </>
    );
}
```

`onHandleReady` is called once the canvas has initialized, with a `CanvasHandle`:

- `smoothPanToWorld(worldX, worldY, durationMs = 600)` — eases the camera so the given world point ends up centered in the viewport, zoom unchanged.
- `smoothPanZoomToWorld(worldX, worldY, targetZoom = 1, durationMs = 600)` — the same, while also easing to `targetZoom` (clamped to `minZoom`/`maxZoom`).
- `getContainerRect(): DOMRect | null` — the canvas container's current bounding rect, or `null` before mount.
- `getItemBounds(): MinimapItem[]` — the world-space bounds of every currently registered `CanvasItem`, as last measured by its `ResizeObserver` — the same data the automatic minimap uses, useful for computing a "fit everything in view" camera move.

Both smooth-pan methods share a single animation loop with touch-release momentum: starting one cancels whichever of the others was still running, so a programmatic camera move can never fight a gesture still coasting from a moment ago.
