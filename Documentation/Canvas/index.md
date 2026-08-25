---
title: Canvas
description: Reference for the pan, zoom, minimap, overlay, and collaborative canvas primitives.
---

`@cratis/components/Canvas` provides a Prime-free React surface over a shared DOM/Pixi spatial engine. It owns gesture coordination, transforms, controls, item measurement, minimap state, and optional Note, Region, and Chat shapes. Product appearance comes from `--cratis-*` tokens and Canvas classes; PrimeReact, PrimeIcons, and a renderer provider are not required.

Canvas belongs to the [Spatial capability profile](../ui-foundation.md#capability-profiles) alongside `PivotViewer` — the only two subpaths that require the optional `pixi.js` peer. Spatial is not a lesser-supported tier: it ships at the same version, behind the same release gates, as every Foundation and Advanced React subpath.

The engine renders and positions arbitrary content independently of the optional presentational shapes. Start with [Basic usage](basic-usage.md), then use the focused guides for [pan and zoom](pan-and-zoom.md), [controls chrome](controls-chrome.md), [notes](notes.md), [regions](regions.md), and the [chat bubble](chat-bubble.md). This page is the complete API reference.

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

Canvas exposes and renders real Pixi objects; PivotViewer renders them internally without exposing Pixi types in its public API. Install the optional peer once in an application that uses either surface:

```bash
npm install pixi.js@^8.20.0
```

Keep one compatible Pixi resolution across the application and Components. Two installed copies produce nominal TypeScript incompatibilities for containers and pointer events even when their APIs look structurally similar.

### Single Pixi peer

This single-resolution rule is not advisory-only: `pixi.js` is declared `peerDependenciesMeta: { "pixi.js": { "optional": true } }` in Components' own `package.json`, so npm/Yarn/pnpm resolve it to whatever compatible version the application installs rather than nesting a private copy. A second, independently resolved `pixi.js` instance produces nominally distinct `PIXI.Container` and pointer-event types even though both satisfy `^8.20.0` — TypeScript treats classes from two different module instances as unrelated types regardless of their shape. Install `pixi.js` once, at the application level, and let both the application and Components resolve it there. See [Optional Pixi, clean no-Pixi core](../ui-foundation.md#optional-pixi-clean-no-pixi-core) for why the public Pixi types stay real rather than becoming a reduced Cratis facade.

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

## DOM and Pixi layers

`Canvas` composes two rendering layers rather than choosing one, and an application can use DOM content alone or mix DOM and Pixi items in the same instance. Canvas always initializes one transparent Pixi `Application` and empty `world` container so `CanvasContext`, `onReady`, and the shared camera have one stable contract; therefore every Canvas consumer still installs the optional Pixi peer. When the world is empty, `Canvas` skips the per-frame GPU render pass.

- **DOM layer** — `children` and `CanvasItem` position arbitrary React/DOM content with ordinary CSS transforms. No Pixi display-object content is created when an application uses only this layer; this is the layer shown by the `WithControlsAndMinimap` Storybook screenshot.
- **Pixi item layer** — the optional `items`/`renderItem` props hand `Canvas` an array of data and a function that builds one `PIXI.Container` per item in the shared Pixi `world`. This exists for item counts where per-item DOM nodes (and DOM-level pan/zoom repaint cost) become the bottleneck; the Pixi layer amortizes many items on the GPU instead.

Both layers share the same camera: panning and zooming transform the DOM layer's CSS and the Pixi `world` container together, so DOM and Pixi content stay registered to the same world coordinates.

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

Components does not know a product compositor's attribute vocabulary. A product opts into its own markers explicitly:

```tsx
import { Canvas, type CanvasCaptureAttributes } from '@cratis/components/Canvas';
import { ProductCompositorSurface } from './ProductCompositorSurface';

const captureAttributes: CanvasCaptureAttributes = {
    layer: 'data-product-compositor-layer',
    content: 'data-product-compositor-content',
    transformHost: 'data-product-compositor-transform-host',
};

<Canvas
    captureAttributes={captureAttributes}
    controlsGlassSurface={<ProductCompositorSurface cornerRadius={999} />}
/>;
```

`layer` marks the Pixi canvas, `content` marks non-plain integrated controls, and `transformHost` marks both pan/zoom hosts. Omit the prop when the product has no capture pipeline. This keeps product-specific names and update ownership outside Components.

## Overlays and SSR

`CanvasOverlay` portals children to `document.body` in the browser. It renders an empty server/hydration placeholder, so importing or server-rendering a Canvas tree does not access `document` before hydration. It uses the same `useSyncExternalStore` browser-detection pattern as `Dialog`, `FilterPanel`, and `ToolbarSlot` elsewhere in Components. `Toaster` is also server-safe, but follows a different contract: its toast-queue store supplies a server snapshot and the component returns `null` when `document` is unavailable. `Canvas`'s own `PIXI.Application` creation likewise runs inside a `useEffect`, so it never executes during server rendering — see the [capability matrix](../ui-foundation.md#capability-matrix) for the equivalent PivotViewer guarantee.

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
