---
title: Toolbar slots for feature-owned tools
description: Let features contribute toolbar tools through a shared ToolbarSlotProvider, with named hosts controlling placement and ordered contributions.
---

Use toolbar slots in Cratis Components when a feature should supply its own tools without passing them through every parent component. The application shell declares where tools appear, and each feature registers what belongs there through `ToolbarSlot`. Both must share the same `ToolbarSlotProvider`.

A slot host is the component that renders registered content. Give `ToolbarGroup` or `ToolbarContext` a `slotName` to append contributed tools after its own children. Use a [`ToolbarLayout`](toolbar-layout.md) with a matching `name` when a feature needs to replace a whole region, including groups and separators.

## Quick Start

Wrap the toolbar and its contributing features in one `ToolbarSlotProvider`. In this example, Draw belongs to the host group and remains first; the matching `ToolbarSlot` adds Favorite after it. `MyFeatureComponent` stands for your own feature component, which can register more tools in the same way:

```tsx
import {
    Toolbar,
    ToolbarButton,
    ToolbarGroup,
    ToolbarSlot,
    ToolbarSlotProvider,
} from '@cratis/components/Toolbar';

export const MyCanvas = () => (
    <ToolbarSlotProvider>
        <Toolbar>
            <ToolbarGroup slotName='canvas-tools'>
                <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
            </ToolbarGroup>
        </Toolbar>

        {/* The feature injects its own button — no prop drilling */}
        <ToolbarSlot slotName='canvas-tools' order={10}>
            <ToolbarButton
                icon={<span aria-hidden='true'>◆</span>}
                title='Feature: Favorite'
            />
        </ToolbarSlot>

        <MyFeatureComponent />
    </ToolbarSlotProvider>
);
```

## Components

### `ToolbarSlotProvider`

Creates the registry of named contributions. Place it above both the toolbar and the features supplying tools. The nearest provider owns a contribution; sharing a slot name does not connect separate providers.

```tsx
<ToolbarSlotProvider>{children}</ToolbarSlotProvider>
```

### `ToolbarSlot`

Renders nothing in the DOM — its only purpose is to register its `children` into the named slot.

```tsx
<ToolbarSlot slotName='my-slot' order={5}>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' />
</ToolbarSlot>
```

The component registers on mount and unregisters on unmount. Mount it with the feature that owns the tools so those tools disappear when the feature leaves the tree. Registration does not require a host to be present at that moment; a matching host in the same provider can render the content later.

`ToolbarSlot` needs a `ToolbarSlotProvider` above it. Without one, its content is dropped without an error and hosts render only their own children. Each provider is an isolated registry, so a slot inside a nested provider does not reach a host outside it.

The slot updates its registration after every render. Hosts are notified when the content reference or `order` changes. Inline children create a new reference on each render of the contributor. For larger contributions that change infrequently, use `useMemo` with the appropriate dependencies, as in the [Toolbar layout](toolbar-layout.md) example.

## Props

| Prop       | Type        | Default  | Description                                                                         |
| ---------- | ----------- | -------- | ----------------------------------------------------------------------------------- |
| `slotName` | `string`    | required | The slot to inject into                                                             |
| `order`    | `number`    | `0`      | Determines render position relative to other slot items — lower values appear first |
| `children` | `ReactNode` | required | The toolbar item(s) to inject                                                       |

## Slot Hosts

Both `ToolbarGroup` and `ToolbarContext` can act as slot hosts via `slotName`. Their own children render first, followed by contributions sorted by `order`. A name identifies content in the provider's registry, not one exclusive destination: if two hosts use the same name in that provider, both render the contributions. Use distinct names for regions that should have different tools.

### Injecting into a `ToolbarGroup`

```tsx
<ToolbarSlotProvider>
    <Toolbar>
        <ToolbarGroup slotName='drawing'>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
        </ToolbarGroup>
    </Toolbar>

    <ToolbarSlot slotName='drawing' order={20}>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Line' />
    </ToolbarSlot>
</ToolbarSlotProvider>
```

### Injecting into a `ToolbarContext`

A context slot lets a feature add tools to one editing mode. Contributed tools follow the context's fade transition and are only available when it is active. Inactive contexts stay mounted but are `inert` and `aria-hidden`; registration alone does not make their tools reachable. See [Context switching](context-switching.md) for mode selection and focus considerations.

```tsx
<ToolbarSlotProvider>
    <Toolbar>
        <ToolbarSection activeContext={currentContext}>
            <ToolbarContext name='drawing' slotName='drawing-extras'>
                <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
            </ToolbarContext>
        </ToolbarSection>
    </Toolbar>

    <ToolbarSlot slotName='drawing-extras' order={5}>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Injected tool' />
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
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Likes' />
    </ToolbarSlot>

    {/* order 10 — appears second */}
    <ToolbarSlot slotName='shared' order={10}>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Favorites' />
    </ToolbarSlot>

    {/* order 20 — appears last */}
    <ToolbarSlot slotName='shared' order={20}>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Notifications' />
    </ToolbarSlot>
</ToolbarSlotProvider>
```

## `useToolbarSlot` Hook

If you need to read slot items directly (for example when building a custom slot host), call `useToolbarSlot`:

```tsx
import { useToolbarSlot } from '@cratis/components/Toolbar';

const MyCustomHost = ({ slotName }: { slotName: string }) => {
    const slotItems = useToolbarSlot(slotName);
    return <div className='my-host'>{slotItems}</div>;
};
```

The hook uses `useSyncExternalStore` internally and returns a stable array until that slot's registrations change. Without a provider or matching registrations, it returns an empty array.

To let a feature supply complete toolbar groups rather than append buttons to an existing group, continue with [Toolbar layout](toolbar-layout.md).
