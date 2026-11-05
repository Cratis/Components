---
title: Toolbar separators between tool clusters
description: Add ToolbarSeparator to divide tools within one palette. Match its orientation to the toolbar so the rule and ARIA orientation run across it.
---

`ToolbarSeparator` divides clusters of buttons with a thin line inside a tool palette. Use it to separate tasks without creating another pill-shaped group. It draws across the toolbar: a vertical rule in a horizontal palette, or a horizontal rule in a vertical palette.

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cratis/components/Toolbar';

function ZoomToolbar() {
    return (
        <Toolbar orientation='horizontal'>
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Overview' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Zoom out' tooltipPosition='bottom' />
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Zoom in' tooltipPosition='bottom' />
            <ToolbarSeparator orientation='horizontal' />
            <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Help' tooltipPosition='bottom' />
        </Toolbar>
    );
}
```

The example keeps Overview, zoom controls, and Help in one palette, with rules between those tasks. Pass the enclosing toolbar's `orientation` to each separator. The prop describes the palette direction; the component draws the rule perpendicular to it.

The separator renders `role='separator'` with that perpendicular `aria-orientation` and is not focusable. It does not create a labeled group or switch the available tools. Use [Toolbar groups](groups.md) for separate pills, or [Context switching](context-switching.md) with `ToolbarSection` when the set of tools needs to change.

## Vertical toolbar

Both `Toolbar` and `ToolbarSeparator` default to vertical orientation, so no prop is needed for a side palette. The separator below draws a horizontal rule between Draw and Undo:

```tsx
<Toolbar>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
    <ToolbarSeparator />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
</Toolbar>
```
