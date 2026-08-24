# Basic Usage

The minimal `Canvas` places one piece of content at a fixed world-space position using `CanvasItem`:

```tsx
import { Canvas, CanvasItem } from '@cratis/components/Canvas';

function MyBoard() {
    return (
        <Canvas>
            <CanvasItem x={100} y={100}>
                <div style={{ width: 160, height: 100, background: 'white', borderRadius: 8 }}>
                    Hello, board!
                </div>
            </CanvasItem>
        </Canvas>
    );
}
```

`Canvas` renders an empty surface by default — nothing appears until you give it content. There are three ways to do that, and they can be mixed:

## 1. Declarative children (`CanvasItem`)

Wrap ordinary React content in `CanvasItem` and pass `x`/`y` world coordinates. This is the normal path for anything interactive — forms, notes, chat panels — because it is plain HTML/React underneath, not a rendering primitive of its own:

```tsx
<Canvas>
    <CanvasItem x={0} y={0}><MyCard /></CanvasItem>
    <CanvasItem x={300} y={150}><MyCard /></CanvasItem>
</Canvas>
```

`CanvasItem` also reports its rendered size back to the `Canvas` (via a `ResizeObserver`), which is what lets the built-in minimap and `CanvasHandle.getItemBounds()` know where every item actually is without you tracking sizes yourself. `zIndex` controls stacking against sibling items, and `onSize` is called whenever the item's own size changes.

## 2. Data-driven items (`items` + `renderItem`)

For a large number of simple items, pass an `items` array and a `renderItem` function instead of JSX children. `Canvas` syncs the array to a WebGL scene under the hood (each item becomes a `PIXI.Container`), diffing additions, removals, and position changes on every render:

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

function DotBoard() {
    return (
        <Canvas
            items={dots}
            renderItem={item => {
                const graphics = new PIXI.Graphics();
                graphics.circle(0, 0, 12).fill((item as Dot).color);
                return graphics;
            }}
            onItemPointerDown={(item) => console.log('clicked', item.id)}
        />
    );
}
```

This path is lower-level than `CanvasItem` (you are building a `PIXI.Container`, not writing JSX) but scales to far more items since nothing here touches the DOM.

## 3. Imperative access (`onReady`)

`onReady` hands you the raw PIXI `Application` and the `world` container once the canvas has initialized, for cases the two approaches above don't cover — managing your own PIXI scene graph directly:

```tsx
<Canvas
    onReady={({ app, world }) => {
        // app: the PIXI.Application: app.stage, app.renderer, ...
        // world: the PIXI.Container everything pans/zooms with
    }}
/>
```

The three approaches compose: declarative `CanvasItem` children, `items`/`renderItem`, and content added imperatively through `onReady` can all be present on the same `Canvas` at once.
