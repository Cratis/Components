---
title: Canvas — build your first board
description: Place a React card on a Canvas board, check pan and zoom, then choose DOM content or Pixi graphics while your application owns the data.
---

Build your first board in Cratis Components by placing a React card inside `CanvasItem`. Canvas supplies pan and zoom; your component supplies the card and its position. Install the `pixi.js` peer and import the stylesheets from [Canvas setup](index.md#import), then render this `MyBoard` component in your application:

```tsx
import { Canvas, CanvasItem } from '@cratis/components/Canvas';

export function MyBoard() {
    return (
        <div style={{ width: '100%', height: 480 }}>
            <Canvas style={{ width: '100%', height: '100%' }}>
                <CanvasItem x={100} y={100}>
                    <div style={{ width: 160, height: 100, background: 'white', borderRadius: 8 }}>
                        Hello, board!
                    </div>
                </CanvasItem>
            </Canvas>
        </div>
    );
}
```

The card appears near the top-left of a 480-pixel-high board. Drag the empty background or scroll to pan, then use `Ctrl`/`Cmd` + wheel or the bottom-left zoom buttons. The card moves and scales with the camera while its world coordinates remain `(100, 100)`. World coordinates describe positions on the board before pan and zoom are applied.

Canvas has no intrinsic size, so give its root a width and height through `style` or `className` as shown. If the root measures zero at mount, Pixi falls back to an 800×600 surface; that fallback does not size your layout for you.

Canvas starts empty. Choose how to supply content from the three approaches below, or combine them on one board.

## 1. Declarative children (`CanvasItem`)

Use `CanvasItem` for interactive content such as a form or a chat panel. Its children remain ordinary HTML and React components, positioned at the `x`/`y` coordinates you supply:

```tsx
<Canvas style={{ width: '100%', height: 480 }}>
    <CanvasItem x={0} y={0}><MyCard /></CanvasItem>
    <CanvasItem x={300} y={150}><MyCard /></CanvasItem>
</Canvas>
```

`MyCard` stands for any component of your own.

`CanvasItem` measures its content with `ResizeObserver`, feeding those dimensions to the minimap and `CanvasHandle.getItemBounds()`. Add `showMinimap` to `Canvas` to offer a minimap toggle populated from the mounted items. Use `zIndex` to control stacking against sibling items and `onSize` when your layout needs the initial measurement and subsequent size changes.

## 2. Data-driven items (`items` + `renderItem`)

Use `items` and `renderItem` for graphics without a DOM node per item. Canvas synchronizes the array with its Pixi scene whenever `items` or `renderItem` changes. Each new id gets a `PIXI.Container`; this example creates two colored dots:

```tsx
import { Canvas, type CanvasItemData } from '@cratis/components/Canvas';
import * as PIXI from 'pixi.js';

interface Dot extends CanvasItemData {
    color: number;
}

const dots: Dot[] = [
    { id: '1', x: 0, y: 0, color: 0x60a5fa },
    { id: '2', x: 120, y: 40, color: 0xf472b6 },
];

export function DotBoard() {
    return (
        <Canvas
            style={{ width: '100%', height: 480 }}
            items={dots}
            renderItem={(item) => new PIXI.Graphics().circle(0, 0, 12).fill(item.color)}
            onItemPointerDown={(item) => console.log('clicked', item.id)}
        />
    );
}
```

The sync is keyed by `id`:

- An `id` that is new calls `renderItem` and adds the container at `x`/`y`.
- An `id` that already has a container only moves it to the new `x`/`y`. `renderItem` is **not** called again, so a changed `color` on an existing item does not repaint it. Give the item a new `id`, or update the container yourself through `onReady`.
- An `id` that disappears removes and destroys its container.

Click a dot to see its id in the console through `onItemPointerDown`. These graphics have no accessible representation of their own, so keep anything a keyboard or screen-reader user must reach in `CanvasItem` content.

## 3. Imperative access (`onReady`)

Use `onReady` when you need to manage Pixi display objects directly. It receives the initialized `Application` and the `world` container that shares the board's camera:

```tsx
<Canvas
    onReady={({ app, world }) => {
        // app: the PIXI.Application (app.stage, app.renderer)
        // world: the PIXI.Container that pans and zooms with the camera
        console.log(app.renderer.width, world.children.length);
    }}
/>
```

`onReady` runs after Pixi initializes inside an effect, so it never runs during server rendering.

All three approaches can share one Canvas. Your application still owns the item data: neither rendering path saves positions or synchronizes changes between users.

Continue to [Pan and zoom](pan-and-zoom.md) to control the camera from your application, or [Controls chrome](controls-chrome.md) to fit navigation controls around side panels.
