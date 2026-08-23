---
title: Canvas
description: Reference for the pan, zoom, minimap, overlay, and collaborative canvas primitives.
---

`@cratis/components/Canvas` provides a renderer-independent React surface for large spatial workspaces. It owns gesture coordination, transforms, controls, item measurement, minimap state, and optional Note, Region, and Chat shapes. Product appearance comes from `--cratis-*` tokens and Canvas classes; PrimeIcons and a renderer provider are not required.

## Import

```tsx
import {
    Canvas,
    CanvasItem,
    CanvasOverlay,
    type CanvasCaptureAttributes,
    type CanvasHandle,
} from '@cratis/components/Canvas';
```

Import `@cratis/components/tokens` and `@cratis/components/styles` once at the application root. Add `@cratis/components/theme` only when using the baseline appearance.

## Canvas

```tsx
const handleReady = (handle: CanvasHandle) => {
    handle.smoothPanZoomToWorld(1200, 800, 1.25);
};

<Canvas
    initialZoom={1}
    minZoom={0.25}
    maxZoom={3}
    showControls
    showMinimap
    onHandleReady={handleReady}
>
    <CanvasItem x={1200} y={800}>
        <article>Customer journey</article>
    </CanvasItem>
</Canvas>;
```

### `CanvasProps<T>`

`T` extends `CanvasItemData` (`id`, `x`, `y`) when the optional Pixi item renderer is used.

| Prop                                       | Type                               | Default                               | Meaning                                                                                                                           |
| ------------------------------------------ | ---------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `children`                                 | `ReactNode`                        | —                                     | DOM canvas content, normally positioned with `CanvasItem`.                                                                        |
| `items`                                    | `T[]`                              | `[]`                                  | Optional Pixi-backed item data.                                                                                                   |
| `renderItem`                               | `(item: T) => PIXI.Container`      | —                                     | Builds one Pixi display object.                                                                                                   |
| `onItemPointerDown`                        | `(item, event) => void`            | —                                     | Receives Pixi item pointer activation.                                                                                            |
| `onReady`                                  | `(context: CanvasContext) => void` | —                                     | Provides the Pixi `app` and `world` container.                                                                                    |
| `onTransformChange`                        | `(zoom, pan) => void`              | —                                     | Reports camera changes.                                                                                                           |
| `initialZoom`                              | `number`                           | `1`                                   | Initial zoom factor.                                                                                                              |
| `initialPan`                               | `{ x: number; y: number }`         | `{ x: 0, y: 0 }`                      | Initial viewport translation.                                                                                                     |
| `minZoom` / `maxZoom`                      | `number`                           | `0.1` / `5`                           | Zoom limits.                                                                                                                      |
| `showControls`                             | `boolean`                          | `true`                                | Shows zoom controls.                                                                                                              |
| `showMinimap`                              | `boolean`                          | `false`                               | Adds the minimap toggle/control.                                                                                                  |
| `minimapWorldWidth` / `minimapWorldHeight` | `number`                           | `4000` / `3000` in the minimap        | World dimensions represented by the minimap.                                                                                      |
| `minimapItems`                             | `MinimapItem[]`                    | measured items                        | Explicit minimap rectangles.                                                                                                      |
| `controlsPlacement`                        | `'bottom-left' \| 'bottom-right'`  | `'bottom-left'`                       | Control-bar edge.                                                                                                                 |
| `className` / `style`                      | standard React values              | —                                     | Canvas root customization.                                                                                                        |
| `onHelp`                                   | `() => void`                       | —                                     | Adds and handles the help action.                                                                                                 |
| `helpTitle`                                | `string`                           | provider-independent English fallback | Help action label.                                                                                                                |
| `controlsLabels`                           | `CanvasControlsLabels`             | English fallbacks                     | Localizes integrated minimap, zoom, reset, and help controls.                                                                     |
| `controlsGlassSurface`                     | `ReactNode`                        | —                                     | Product-owned glass/acrylic surface rendered behind integrated controls.                                                          |
| `disableControlsGlass`                     | `boolean`                          | `false`                               | Forces the low-cost CSS frosted pill. The same fallback is used automatically when no `controlsGlassSurface` is supplied.         |
| `captureAttributes`                        | `CanvasCaptureAttributes`          | —                                     | Product-owned layer/content/transform-host attribute names for a capture or compositor pipeline. Nothing is hardcoded by default. |
| `onHandleReady`                            | `(handle: CanvasHandle) => void`   | —                                     | Provides imperative camera/item-bound operations.                                                                                 |
| `readOnly`                                 | `boolean`                          | `false`                               | Keeps pan/zoom but absorbs content interaction.                                                                                   |
| `backgroundDragPans`                       | `boolean`                          | `true`                                | Set `false` when the product owns empty-background drag selection. Wheel, middle-button, and touch panning remain available.      |

### `CanvasHandle`

| Method                                           | Meaning                                                     |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `smoothPanToWorld(x, y, durationMs?)`            | Centers a world point with an animated pan.                 |
| `smoothPanZoomToWorld(x, y, zoom?, durationMs?)` | Animates pan and zoom together.                             |
| `getContainerRect()`                             | Returns the current viewport rectangle or `null`.           |
| `getItemBounds()`                                | Returns measured world-space rectangles as `MinimapItem[]`. |

## CanvasItem

`CanvasItem` positions and measures DOM content inside a `Canvas`.

| Prop       | Type                      | Meaning                                                                                                                        |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `x` / `y`  | `number`                  | World position.                                                                                                                |
| `zIndex`   | `number`                  | Item-root stacking order. Use this rather than a descendant z-index because each transformed item is its own stacking context. |
| `onSize`   | `(width, height) => void` | Reports measured size changes.                                                                                                 |
| `children` | `ReactNode`               | Item content.                                                                                                                  |

## Controls and minimap

`CanvasControls` is exported for products that compose controls separately. Its callbacks are `getZoom`, `onZoomIn`, `onZoomOut`, and `onZoomReset`; optional minimap, placement, help, label, glass-surface, and low-cost fallback props match the integrated Canvas controls. Standalone controls can set `contentCaptureAttribute` when a product compositor needs to mark their non-plain surface.

`CanvasControlsLabels` localizes `toggleMinimap`, `zoomOut`, `resetZoom`, `zoomIn`, and `help`.

`CanvasMinimap` accepts `worldWidth`, `worldHeight`, `items`, and `onRequestPan`. A `MinimapItem` contains `x`, `y`, `width`, `height`, and optional `color`. Its ref exposes `CanvasMinimapHandle.update(pan, zoom, canvasWidth, canvasHeight)`.

### Product capture/compositor integration

Components does not know Studio's Liquid Glass attribute vocabulary. A product opts into its own markers explicitly:

```tsx
import { Canvas, type CanvasCaptureAttributes } from '@cratis/components/Canvas';
import LiquidGlassSurface from './LiquidGlassSurface'; // product-owned surface

const captureAttributes: CanvasCaptureAttributes = {
    layer: 'data-liquid-glass-layer',
    content: 'data-liquid-glass-content',
    transformHost: 'data-liquid-glass-transform-host',
};

<Canvas
    captureAttributes={captureAttributes}
    controlsGlassSurface={<LiquidGlassSurface cornerRadius={999} />}
/>;
```

`layer` marks the Pixi canvas, `content` marks non-plain integrated controls, and `transformHost` marks both pan/zoom hosts. Omit the prop when the product has no capture pipeline. This keeps provider-specific names and update ownership outside Components.

## Overlays and SSR

`CanvasOverlay` portals children to `document.body` in the browser. It renders an empty server/hydration placeholder, so importing or server-rendering a Canvas tree does not access `document` before hydration.

Use it for floating controls that must escape canvas clipping:

```tsx
<CanvasOverlay>
    <aside className='product-canvas-inspector'>Inspector</aside>
</CanvasOverlay>
```

## Included shapes

The Canvas entry point also exports:

- `Note`, `NoteProps`, and `NoteData` for movable/resizable editable notes.
- `Region`, `RegionProps`, and `RegionData` for labeled spatial grouping.
- Chat composition primitives: `Chat`, `ChatBubble`, `ChatComposer`, `ChatMessageBubble`, `MessageReactions`, `ReactionPicker`, `TypingIndicator`, `FailedReply`, and their exported data/label types.
- Avatar, emoji-memory/catalog, and mention parsing/application helpers used by the chat primitives.
- `AnchoredOverlay` and its side/alignment types for body-level overlays attached to a control.
- `canvasGesture`, `canvasTransformActivity`, and `createSelfSuspendingFrameLoop` for advanced canvas integrations.

These shapes are optional conveniences, not domain models. Applications own persistence, authorization, and collaboration policy. Arc can own commands, queries, validation, authorization, and generated React bindings without Chronicle. Applications that choose Arc plus Chronicle additionally own event streams, projections, and read models. Pass typed data and callbacks into Canvas shapes rather than coupling them to generated proxies.

## Styling

Canvas structure uses the standard semantic token seam:

- `--cratis-surface-card`, `--cratis-surface-hover`, `--cratis-surface-border`
- `--cratis-text-color`, `--cratis-text-color-secondary`
- `--cratis-primary-color`, `--cratis-green-500`, `--cratis-red-500`

Use `className` on Canvas roots and product CSS for shape-specific treatment. Components does not install an icon font; library-owned actions use bundled React icon components.
