---
title: Canvas — customize navigation controls
description: Adapt Canvas zoom and minimap controls to your application with translated labels, custom icons, panel offsets, and an optional glass surface.
---

Customize the built-in navigation bar on a Cratis Components Canvas through its `controls*` props. You can translate button labels, replace icons, and keep the bar clear of side panels without building your own controls. Canvas renders `CanvasControls` when `showControls` is true, which is the default.

Start with a board from [Basic usage](basic-usage.md), then apply the options you need below. The integrated bar handles zoom automatically. Enable `showMinimap` to add its minimap toggle; provide `onHelp` to add a help button. The middle percentage button restores 100% zoom, regardless of `initialZoom`.

When consulting the `CanvasControls` API directly, use this mapping from Canvas props:

| `Canvas` prop           | Forwarded to `CanvasControls` as |
| ----------------------- | -------------------------------- |
| `controlsGlassSurface`  | `glassSurface`                   |
| `disableControlsGlass`  | `disableGlass`                   |
| `controlsLabels`        | `labels`                         |
| `controlsIcons`         | `icons`                          |
| `controlsFollowViewportInsets` | `followViewportInsets`    |
| `helpTitle`             | `helpTitle`                      |
| `onHelp`                | `onHelp`                         |
| `controlsPlacement`     | `placement`                      |
| `showMinimap`           | `showMinimapToggle`              |
| `captureAttributes.content` | `contentCaptureAttribute`    |

Canvas supplies `getZoom`, `onZoomIn`, `onZoomOut`, `onZoomReset`, `minimapItems`, the minimap world size, and `onMinimapPan`. Render `CanvasControls` directly only when you need controls outside Canvas, where you must provide the camera callbacks and minimap data yourself.

## `glassSurface` — custom chrome behind the pill

```tsx
<Canvas
    style={{ width: '100%', height: 480 }}
    controlsGlassSurface={<MyFrostedGlassSurface cornerRadius={999} />}
/>
```

Here, chrome means the surface behind the control bar. `MyFrostedGlassSurface` stands for a component from your own design system. Without `controlsGlassSurface`, the bar uses a rounded CSS `backdrop-filter` surface (`.canvas-controls-glass--plain`) with no extra dependency.

Set `disableControlsGlass` to ignore a supplied glass component and use the CSS surface instead. Choose this when your custom glass captures the full scene and would re-rasterize board content on every interaction frame.

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

## `icons` — using your own icon set

The minimap, zoom-out, zoom-in and help buttons draw built-in icons. Replace any subset with `controlsIcons` so the controls match the rest of your application:

```tsx
import { Canvas, type CanvasControlsIcons } from '@cratis/components/Canvas';

const icons: CanvasControlsIcons = {
    toggleMinimap: <MyIcon name='map' aria-hidden='true' />,
    zoomOut: <MyIcon name='minus' aria-hidden='true' />,
    zoomIn: <MyIcon name='plus' aria-hidden='true' />,
    help: <MyIcon name='help' aria-hidden='true' />,
};

<Canvas showMinimap controlsIcons={icons} onHelp={() => console.log('help')} />;
```

`MyIcon` stands for your own icon component. Fields left unset keep the built-in icon. The replacement is rendered inside the button as it is, so keep it decorative with `aria-hidden`; the button's accessible name and tooltip still come from `controlsLabels`. The zoom-percentage button shows the zoom value and has no icon to replace.

## Keeping the controls clear of host panels

If a sidebar or drawer overlaps the canvas edge, set its overlap width with a CSS custom property on an ancestor of Canvas. The controls read the property for their chosen corner:

| Custom property           | Read by the controls when placed |
| ------------------------- | -------------------------------- |
| `--canvas-viewport-left`  | `bottom-left`                    |
| `--canvas-viewport-right` | `bottom-right`                   |

The bar moves inward by that width and animates when the value changes. Both properties default to `0px`; leave them unset when panels do not overlap the board.

When the host already makes room itself, by shrinking or shifting the canvas by that inset, set `controlsFollowViewportInsets` to `false`. The bar then stays `1rem` from the canvas edge instead of being moved a second time:

```tsx
<div style={{ marginLeft: 'var(--canvas-viewport-left, 0px)' }}>
    <Canvas style={{ width: '100%', height: 480 }} controlsFollowViewportInsets={false} />
</div>
```

After applying an option, check the controls it affects: tooltips and accessible names should use your labels, and opening a side panel should leave the bar visible without shifting it twice. See [Pan and zoom](pan-and-zoom.md#controls-and-minimap) to configure placement and the world area represented by the minimap.
