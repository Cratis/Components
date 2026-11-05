---
title: Canvas API reference
description: Build React boards with Canvas pan, zoom, minimap, and shape APIs while your application owns persistence and collaboration.
---

Canvas in Cratis Components is a React board surface for arranging content in a shared coordinate space with pan, zoom, and a minimap. Use ordinary React content, Pixi graphics, or both. Canvas handles navigation and measurement; your application supplies the board data and owns persistence, authorization, and collaboration.

Start with [Basic usage](basic-usage.md) to place your first card. Then [customize the controls](controls-chrome.md), add [notes](notes.md) or [regions](regions.md), or place a [conversation beside an item](chat-bubble.md). Use this page to look up the APIs and [Pan and zoom](pan-and-zoom.md) for gesture and camera behavior.

Canvas belongs to the [Spatial capability profile](../ui-foundation.md#capability-profiles) alongside `PivotViewer`. Both subpaths require the `pixi.js` peer. Appearance comes from `--cratis-*` tokens and Canvas classes; PrimeReact, PrimeIcons, and a renderer provider are not required.

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

Install the Pixi peer in any application that imports `@cratis/components/Canvas`:

```bash
npm install pixi.js@^8.20.0
```

The peer is optional for Components as a whole, but required for this subpath. Its module loads `pixi.js` even when you use only DOM content, `Note`, `Region`, or the chat primitives.

### Single Pixi peer

Keep the application and Components on one compatible Pixi resolution. Canvas exposes Pixi types such as `PIXI.Container` directly, so separately resolved copies can cause TypeScript incompatibilities when you pass objects between them. The optional peer declaration does not itself guarantee a single installed copy. See [Optional Pixi, clean no-Pixi core](../ui-foundation.md#optional-pixi-clean-no-pixi-core) for the dependency boundary.

## Canvas

```tsx
const handleReady = (handle: CanvasHandle) => {
    handle.smoothPanZoomToWorld(1200, 800, 1.25);
};

<Canvas
    style={{ width: '100%', height: 600 }}
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

Canvas does not size itself. Its root has no width or height rule, and the Pixi surface follows the root's measured size through a `ResizeObserver` (falling back to 800×600 when the root measures zero at mount). Give the root a size with `style` or `className`, as above, or place it in a sized container and set `height: '100%'`.

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
| `controlsIcons`                            | `CanvasControlsIcons`              | built-in icons                        | Replaces the integrated minimap, zoom, and help button glyphs. See [Canvas controls chrome](controls-chrome.md).                  |
| `controlsFollowViewportInsets`             | `boolean`                          | `true`                                | Steps the integrated controls aside by the host's `--canvas-viewport-left`/`--canvas-viewport-right` inset.                       |
| `controlsGlassSurface`                     | `ReactNode`                        | —                                     | Product-owned glass/acrylic surface rendered behind integrated controls.                                                          |
| `disableControlsGlass`                     | `boolean`                          | `false`                               | Forces the CSS frosted pill. The same fallback is used automatically when no `controlsGlassSurface` is supplied.         |
| `captureAttributes`                        | `CanvasCaptureAttributes`          | —                                     | Product-owned layer/content/transform-host attribute names for a capture or compositor pipeline. Nothing is hardcoded by default. |
| `onHandleReady`                            | `(handle: CanvasHandle) => void`   | —                                     | Provides imperative camera/item-bound operations.                                                                                 |
| `readOnly`                                 | `boolean`                          | `false`                               | Keeps pan/zoom but absorbs content interaction: a transparent layer blocks pointers, and the content layer is marked `inert`, so it cannot be reached with the keyboard either. |
| `backgroundDragPans`                       | `boolean`                          | `true`                                | Set `false` when the product owns empty-background drag selection. Wheel, middle-button, and touch panning remain available.      |

### `CanvasHandle`

| Method                                           | Meaning                                                     |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `smoothPanToWorld(x, y, durationMs?)`            | Centers a world point with an animated pan (default 600 ms). |
| `smoothPanZoomToWorld(x, y, zoom?, durationMs?)` | Animates pan and zoom together (default zoom `1`, 600 ms).  |
| `getContainerRect()`                             | Returns the current viewport rectangle or `null`.           |
| `getItemBounds()`                                | Returns measured world-space rectangles as `MinimapItem[]`. |

## DOM and Pixi layers

Use the DOM layer for interactive React content. `children` and `CanvasItem` position that content with CSS transforms, keeping forms, buttons, and other HTML controls in the DOM.

For graphics, the optional `items`/`renderItem` props build one `PIXI.Container` per item in the shared Pixi `world`, without a DOM node per item. `renderItem` runs once per new `id`; later updates to that id move its container without rebuilding its appearance. See [Basic usage](basic-usage.md) for an example and the update rules.

Both layers share the same camera, so DOM and Pixi content stay aligned when you pan or zoom. Canvas initializes a transparent Pixi `Application` even for DOM-only boards, which is why every Canvas consumer needs the peer. It skips the per-frame GPU render pass when the Pixi world is empty.

## CanvasItem

`CanvasItem` positions and measures DOM content inside a `Canvas`.

| Prop       | Type                      | Meaning                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | `string`                  | Registers the item under your application's key for region membership reports. Without an explicit id, the item still contributes measured bounds to the minimap and camera operations but is excluded from region membership. |
| `x` / `y`  | `number`                  | World position.                                                                                                                                                                                                                                                                                                                                     |
| `zIndex`   | `number`                  | Item-root stacking order. Use this rather than a descendant z-index because each transformed item is its own stacking context.                                                                                                                                                                                                                      |
| `onSize`   | `(width, height) => void` | Reports measured size changes.                                                                                                                                                                                                                                                                                                                      |
| `children` | `ReactNode`               | Item content.                                                                                                                                                                                                                                                                                                                                       |

### Item registry: `getSnapshot`/`subscribe`

`CanvasItemRegistryContextValue` (the contract `CanvasItem` registers through) also exposes an optional `getSnapshot()`/`subscribe(listener)` pair, compatible with React's `useSyncExternalStore` — this is what lets `Region` (below) watch the registry for containment without polling. Both are optional so a consumer supplying its own registry value predating these members keeps type-checking; a reader falls back to an empty, unchanging registry when either is absent.

## Controls and minimap

`CanvasControls` is exported for products that compose controls separately. Its callbacks are `getZoom`, `onZoomIn`, `onZoomOut`, and `onZoomReset`; optional minimap, placement, help, label, glass-surface, and low-cost fallback props match the integrated Canvas controls. Standalone controls can set `contentCaptureAttribute` when a product compositor needs to mark their non-plain surface.

`CanvasControlsLabels` localizes `toggleMinimap`, `zoomOut`, `resetZoom`, `zoomIn`, and `help`.

The integrated control bar zooms in and out by a factor of 1.2 around the viewport center. Its middle button shows the current zoom percentage and resets zoom to 100% (not to `initialZoom`); pan is unchanged.

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

`CanvasOverlay` renders children into `document.body` in the browser, outside the canvas's clipping boundary. During server rendering and initial hydration it renders an empty placeholder instead of accessing `document`. Canvas also defers Pixi application creation to an effect, so that initialization does not run on the server. See the [capability matrix](../ui-foundation.md#capability-matrix) for the server-rendering boundaries of other Components surfaces.

Use the overlay for floating controls that must remain visible beyond the canvas edge:

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

These are exported from the Canvas subpath, so importing them also loads `pixi.js`. The chat kit source itself does not use Pixi, but `@cratis/components/Chat` does not re-export `Chat`, `ChatBubble`, `ChatComposer`, or the other kit primitives listed above; see [Chat bubble](chat-bubble.md).

Pass data and callbacks into these shapes from your application. Editing a note or sending a chat message does not save it or synchronize it with other users; connect the callbacks to your own state and backend.

Shapes also publish local interaction messages through the `@cratis/arc.react` messenger. `Region` reports sibling item membership, `Note` reports committed text, and `Chat` reports sends when it has an `id`. These announcements supplement callbacks; they are not a persistence or collaboration transport. See [Messaging](messaging.md) for subscriptions, identity rules, and behavior without an Arc provider. The exported `itemsWithinRegion(regionBounds, items, excludeId?)` function and `RegionContainmentBounds` type let your application use the same center-point containment test separately.

## Keyboard and accessibility

- The integrated controls are native buttons with accessible names (`controlsLabels` overrides the English defaults), so they are reachable with `Tab` and activate with `Enter` or `Space`.
- The canvas surface itself has no keyboard pan or zoom. Panning and zooming the camera without a pointer goes through the zoom buttons or your own controls calling `CanvasHandle`.
- `Note` and `Region` move, resize, and enter editing through pointer gestures (drag, handles, double-click). They have no keyboard equivalents; a board that must be operable from the keyboard needs host-owned alternatives.
- Pixi items drawn through `renderItem` are canvas pixels with no accessible representation. Put anything a keyboard or screen-reader user must reach in DOM content (`CanvasItem`).

## Styling

Canvas structure uses the standard semantic token seam:

- `--cratis-surface-card`, `--cratis-surface-hover`, `--cratis-surface-border`
- `--cratis-text-color`, `--cratis-text-color-secondary`
- `--cratis-primary-color`, `--cratis-green-500`, `--cratis-red-500`

Use `className` on Canvas roots and product CSS for shape-specific treatment. Components does not install an icon font; library-owned actions use bundled React icon components.
