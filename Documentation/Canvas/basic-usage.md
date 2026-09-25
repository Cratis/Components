---
title: Canvas basic usage
description: Put DOM content, Pixi items, or your own Pixi scene on a Canvas.
---

The minimal `Canvas` places one piece of content at a fixed world-space position using `CanvasItem`. Install the `pixi.js` peer and import the stylesheets first; see [Canvas](index.md#import).

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

The card appears near the top-left of a 480-pixel-high board. Drag the empty background or scroll to pan, and use `Ctrl`/`Cmd` + wheel or the zoom buttons in the bottom-left corner to zoom.

Canvas has no intrinsic size, so give its root a size through `style` or `className` as shown. Without one, the Pixi surface falls back to 800×600 pixels when the root measures zero at mount.

`Canvas` renders an empty surface by default — nothing appears until you give it content. There are three ways to do that, and they can be mixed:

## 1. Declarative children (`CanvasItem`)

Wrap ordinary React content in `CanvasItem` and pass `x`/`y` world coordinates. This is the normal path for anything interactive — forms, notes, chat panels — because it is plain HTML/React underneath, not a rendering primitive of its own:

```tsx
<Canvas style={{ width: '100%', height: 480 }}>
    <CanvasItem x={0} y={0}><MyCard /></CanvasItem>
    <CanvasItem x={300} y={150}><MyCard /></CanvasItem>
</Canvas>
```

`MyCard` stands for any component of your own.

`CanvasItem` also reports its rendered size back to the `Canvas` (via a `ResizeObserver`), which is what lets the built-in minimap and `CanvasHandle.getItemBounds()` know where every item actually is without you tracking sizes yourself. `zIndex` controls stacking against sibling items, and `onSize` is called whenever the item's own size changes.

## 2. Data-driven items (`items` + `renderItem`)

For a large number of simple items, pass an `items` array and a `renderItem` function instead of JSX children. `Canvas` syncs the array to its Pixi scene (each item becomes a `PIXI.Container`) whenever `items` or `renderItem` changes:

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

This path is lower-level than `CanvasItem` (you are building a `PIXI.Container`, not writing JSX) but avoids one DOM node per item. Pixi items have no accessible representation, so keep anything a keyboard or screen-reader user must reach in `CanvasItem` content.

## 3. Imperative access (`onReady`)

`onReady` hands you the raw PIXI `Application` and the `world` container once the canvas has initialized, for cases the two approaches above don't cover — managing your own PIXI scene graph directly:

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

The three approaches compose: declarative `CanvasItem` children, `items`/`renderItem`, and content added imperatively through `onReady` can all be present on the same `Canvas` at once.
