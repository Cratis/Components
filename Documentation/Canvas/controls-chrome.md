# Controls Chrome

`Canvas` renders its own `CanvasControls` instance when `showControls` is true (the default) — you don't normally render `CanvasControls` yourself. Two of its props are still worth knowing about, since `Canvas` forwards neither of them and a consumer who needs them renders `CanvasControls` directly instead.

## `glassSurface` — custom chrome behind the pill

```tsx
<CanvasControls
    getZoom={() => 1}
    onZoomIn={() => {}}
    onZoomOut={() => {}}
    onZoomReset={() => {}}
    glassSurface={<MyFrostedGlassSurface cornerRadius={999} />}
/>
```

`glassSurface` lets a consumer supply their own glass/acrylic surface to render behind the control bar — the spot a "frosted glass" component from a design system would occupy. When omitted, nothing extra is rendered there and the control bar falls back to its own plain CSS: a GPU-composited `backdrop-filter` pill (`.canvas-controls-glass`), no extra dependency required. `glassSurface` is ignored entirely when `disableGlass` is set.

## `labels` — localizing the button text

Every button in the control bar has an English default tooltip. Override any subset of them with `labels`:

```tsx
import type { CanvasControlsLabels } from '@cratis/components/Canvas';

const labels: CanvasControlsLabels = {
    toggleMinimap: 'Vis minikart',
    zoomOut: 'Zoom ut',
    resetZoom: 'Nullstill zoom',
    zoomIn: 'Zoom inn',
    help: 'Hjelp',
};

<CanvasControls
    getZoom={() => 1}
    onZoomIn={() => {}}
    onZoomOut={() => {}}
    onZoomReset={() => {}}
    labels={labels}
/>
```

Fields left unset keep their literal English default — this library ships no i18n mechanism of its own, so a consumer that localizes passes translated strings through `labels` (or through `Canvas`'s own `helpTitle` prop for the help button's tooltip specifically, which takes priority over `labels.help`).

Every other `CanvasControls` prop (`getZoom`, `onZoomIn`/`onZoomOut`/`onZoomReset`, `showMinimapToggle`, `minimapItems`, `onMinimapPan`, `placement`, `onHelp`, `disableGlass`) is wired up automatically when you use `Canvas`'s own `showControls`/`showMinimap`/`controlsPlacement`/`onHelp`/`helpTitle`/`disableControlsGlass` props — see [Pan & Zoom](pan-and-zoom.md).
