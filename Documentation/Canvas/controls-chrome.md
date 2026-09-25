---
title: Canvas controls chrome
description: Localize the Canvas zoom controls and render your own glass surface behind them.
---

`Canvas` renders its own `CanvasControls` instance when `showControls` is true (the default), and it forwards every control option through its own props. You do not need to render `CanvasControls` yourself to localize or restyle the integrated controls.

| `Canvas` prop           | Forwarded to `CanvasControls` as |
| ----------------------- | -------------------------------- |
| `controlsGlassSurface`  | `glassSurface`                   |
| `disableControlsGlass`  | `disableGlass`                   |
| `controlsLabels`        | `labels`                         |
| `helpTitle`             | `helpTitle`                      |
| `onHelp`                | `onHelp`                         |
| `controlsPlacement`     | `placement`                      |
| `showMinimap`           | `showMinimapToggle`              |
| `captureAttributes.content` | `contentCaptureAttribute`    |

`Canvas` also wires `getZoom`, `onZoomIn`, `onZoomOut`, `onZoomReset`, `minimapItems`, the minimap world size, and `onMinimapPan` for you. Render `CanvasControls` directly only when you compose the controls outside a `Canvas`; then you supply those callbacks yourself.

## `glassSurface` — custom chrome behind the pill

```tsx
<Canvas
    style={{ width: '100%', height: 480 }}
    controlsGlassSurface={<MyFrostedGlassSurface cornerRadius={999} />}
/>
```

`MyFrostedGlassSurface` stands for your own component, for example a frosted-glass surface from your design system. When you omit `controlsGlassSurface`, nothing extra is rendered and the control bar uses its own CSS: a GPU-composited `backdrop-filter` pill (`.canvas-controls-glass--plain`), with no extra dependency. Setting `disableControlsGlass` forces that CSS pill and ignores `controlsGlassSurface`. Use it on large boards where a full-scene glass capture would re-rasterize the content behind the controls on every interaction frame.

## `labels` — localizing the button text

Every button in the control bar has an English default used as its tooltip and accessible name: `Toggle minimap`, `Zoom Out`, `Reset Zoom`, `Zoom In`, and `Help`. Override any subset with `controlsLabels`:

```tsx
import { Canvas, type CanvasControlsLabels } from '@cratis/components/Canvas';

const labels: CanvasControlsLabels = {
    toggleMinimap: 'Vis minikart',
    zoomOut: 'Zoom ut',
    resetZoom: 'Nullstill zoom',
    zoomIn: 'Zoom inn',
    help: 'Hjelp',
};

<Canvas showMinimap controlsLabels={labels} onHelp={() => console.log('help')} />;
```

Fields left unset keep their literal English default. Components ships no i18n mechanism of its own, so a localized application passes translated strings through `controlsLabels`. For the help button, `helpTitle` takes priority over `labels.help`. The help button renders only when `onHelp` is set, and the minimap toggle only when `showMinimap` is true.

See [Pan and zoom](pan-and-zoom.md#controls-and-minimap) for placement and minimap options.
