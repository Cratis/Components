# Toolbar Slots

The slot system lets any component in the React tree inject toolbar items into a named slot without prop drilling. The slot host (a `ToolbarGroup` or a `ToolbarContext`) declares the slot name; any number of independent contributors can register items into it. The registry is managed by a `ToolbarSlotProvider` that must wrap both the toolbar and the contributors.

## Quick Start

Wrap the relevant part of the tree in a `ToolbarSlotProvider`, give a `ToolbarGroup` a `slotName`, and use `ToolbarSlot` anywhere inside the provider to inject items:

```tsx
import { ToolbarSlotProvider, ToolbarSlot } from '@cratis/components';

export const MyCanvas = () => (
    <ToolbarSlotProvider>
        <Toolbar>
            <ToolbarGroup slotName='canvas-tools'>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
            </ToolbarGroup>
        </Toolbar>

        {/* The feature injects its own button — no prop drilling */}
        <ToolbarSlot slotName='canvas-tools' order={10}>
            <ToolbarButton icon='pi pi-star' title='Feature: Favorite' />
        </ToolbarSlot>

        <MyFeatureComponent />
    </ToolbarSlotProvider>
);
```

## Components

### `ToolbarSlotProvider`

Creates the slot registry and makes it available to the rest of the tree. Place it as high as needed so that both the toolbar and all contributing components fall inside it.

```tsx
<ToolbarSlotProvider>
    {children}
</ToolbarSlotProvider>
```

### `ToolbarSlot`

Renders nothing in the DOM — its only purpose is to register its `children` into the named slot.

```tsx
<ToolbarSlot slotName='my-slot' order={5}>
    <ToolbarButton icon='pi pi-cog' title='Settings' />
</ToolbarSlot>
```

The component registers on mount and unregisters on unmount, so conditional rendering works naturally.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `slotName` | `string` | required | The slot to inject into |
| `order` | `number` | `0` | Determines render position relative to other slot items — lower values appear first |
| `children` | `ReactNode` | required | The toolbar item(s) to inject |

## Slot Hosts

Both `ToolbarGroup` and `ToolbarContext` can act as slot hosts via the `slotName` prop. Injected items are appended after the host's own children, sorted by `order`.

### Injecting into a `ToolbarGroup`

```tsx
<ToolbarSlotProvider>
    <Toolbar>
        <ToolbarGroup slotName='drawing'>
            <ToolbarButton icon='pi pi-pencil' title='Draw' />
        </ToolbarGroup>
    </Toolbar>

    <ToolbarSlot slotName='drawing' order={20}>
        <ToolbarButton icon='pi pi-minus' title='Line' />
    </ToolbarSlot>
</ToolbarSlotProvider>
```

### Injecting into a `ToolbarContext`

Items injected into a `ToolbarContext` slot are only visible when that context is active. The slot items participate in the context's fade-in/out animation.

```tsx
<ToolbarSlotProvider>
    <Toolbar>
        <ToolbarSection activeContext={currentContext}>
            <ToolbarContext name='drawing' slotName='drawing-extras'>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
            </ToolbarContext>
        </ToolbarSection>
    </Toolbar>

    <ToolbarSlot slotName='drawing-extras' order={5}>
        <ToolbarButton icon='pi pi-star' title='Injected tool' />
    </ToolbarSlot>
</ToolbarSlotProvider>
```

## Multiple Contributors

Any number of independent components can register into the same slot. They are rendered in ascending `order`:

```tsx
<ToolbarSlotProvider>
    <Toolbar>
        <ToolbarGroup slotName='shared' />
    </Toolbar>

    {/* order 5 — appears first */}
    <ToolbarSlot slotName='shared' order={5}>
        <ToolbarButton icon='pi pi-heart' title='Likes' />
    </ToolbarSlot>

    {/* order 10 — appears second */}
    <ToolbarSlot slotName='shared' order={10}>
        <ToolbarButton icon='pi pi-star' title='Favorites' />
    </ToolbarSlot>

    {/* order 20 — appears last */}
    <ToolbarSlot slotName='shared' order={20}>
        <ToolbarButton icon='pi pi-bell' title='Notifications' />
    </ToolbarSlot>
</ToolbarSlotProvider>
```

## `useToolbarSlot` Hook

If you need to read slot items directly (for example when building a custom slot host), call `useToolbarSlot`:

```tsx
import { useToolbarSlot } from '@cratis/components';

const MyCustomHost = ({ slotName }: { slotName: string }) => {
    const slotItems = useToolbarSlot(slotName);
    return <div className='my-host'>{slotItems}</div>;
};
```

The hook uses `useSyncExternalStore` internally and only triggers re-renders when the slot's content actually changes.
