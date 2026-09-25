---
title: Toolbar groups
description: Cluster related tools into ToolbarGroup pills, with optional slot injection.
---

`ToolbarGroup` is a formal logical sub-group of toolbar items. Where a plain sequence of buttons is a flat list, a group gives a cluster of related buttons a shared boundary. Each group renders as its own pill, and a `Toolbar` with a `ToolbarGroup` as a direct child drops its own background, border, and padding and spaces the pills apart. The gap between pills shows the structure without explicit `ToolbarSeparator` elements.

Because the toolbar's own pill disappears as soon as it has a group child, put every tool of such a toolbar inside a group; a button placed directly beside the groups has no background of its own.

```tsx
import { Toolbar, ToolbarButton, ToolbarGroup } from '@cratis/components/Toolbar';

<Toolbar>
    <ToolbarGroup>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Pan' />
    </ToolbarGroup>
    <ToolbarGroup>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Circle' />
    </ToolbarGroup>
    <ToolbarGroup>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Redo' />
    </ToolbarGroup>
</Toolbar>
```

## Orientation

Use the `orientation` prop to control how the group lays out its children. The default is `'vertical'`, matching a vertical toolbar.

```tsx
<ToolbarGroup orientation='horizontal'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Zoom out' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Zoom in' />
</ToolbarGroup>
```

| Value | Layout |
|---|---|
| `'vertical'` (default) | Children stacked top-to-bottom |
| `'horizontal'` | Children arranged left-to-right |

## Slot Injection

A group can act as a **slot host**: other components anywhere in the React tree can inject buttons into it without prop drilling. Set `slotName` on the group and wrap the tree in a `ToolbarSlotProvider`.

```tsx
// toolbar.tsx — the toolbar declares a slot host
<ToolbarSlotProvider>
    <Toolbar>
        <ToolbarGroup slotName='canvas-tools'>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
        </ToolbarGroup>
    </Toolbar>

    {/* anywhere else in the tree */}
    <ToolbarSlot slotName='canvas-tools' order={10}>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Favorite' />
    </ToolbarSlot>
</ToolbarSlotProvider>
```

Injected items appear after the group's own children, sorted by their `order` value. `ToolbarGroup` adds no ARIA grouping role; it is a styled `div` inside the toolbar. See [Slots](./slots.md) for the full slot API.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Buttons and other toolbar items to render in the group |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction for child items |
| `slotName` | `string` | — | Optional. When set, the group renders injected slot items after its own children |
