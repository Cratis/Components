---
title: Toolbar groups for related tools
description: Use ToolbarGroup to place related tools in separate pills. Match group orientation to the toolbar and add tools from other components through slots.
---

`ToolbarGroup` puts related tools in a shared pill-shaped container so users can distinguish clusters such as navigation, drawing, and history. Use groups for separate visual clusters, or [separators](sections.md) when a dividing line inside one palette is enough.

When a `ToolbarGroup` is a direct child of `Toolbar`, the toolbar removes its own background, border, and padding. Each group supplies its own pill, with a gap between adjacent groups. Put every tool in a group when using this layout: a button placed directly beside the groups has no pill background of its own.

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

The example separates navigation tools from drawing tools and history actions. These are visual boundaries: `ToolbarGroup` renders a styled `div` without an ARIA grouping role, and it does not manage tool selection. Keep meaningful names on the buttons and connect persistent modes through [Active state](active-state.md).

## Orientation

Set `orientation` on each group as well as the enclosing toolbar. A group defaults to `'vertical'`; it does not inherit the root's direction. For a horizontal palette, use `'horizontal'` on both:

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

When a feature needs to contribute tools without passing them through every parent component, give the group a named slot. Wrap the toolbar and contributing components in the same `ToolbarSlotProvider`, then match the group's `slotName` in a `ToolbarSlot`:

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

Here, Draw stays in the group and Favorite is added after it through the `canvas-tools` slot. Contributions appear after the group's own children, sorted by ascending `order`. The name connects the contribution to its host; both must share the provider. Continue with [Slots](./slots.md) when more than one feature contributes tools or their order needs to change.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Buttons and other toolbar items to render in the group |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction for child items |
| `slotName` | `string` | — | Optional. When set, the group renders injected slot items after its own children |
