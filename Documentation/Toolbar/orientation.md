---
title: Orientation
description: Lay a Toolbar out vertically or horizontally.
---

`orientation` controls the direction of a tool palette and its arrow-key navigation. Use a horizontal toolbar for a row of canvas tools, or keep the default `vertical` layout for a side palette.

The supported values are `'vertical'` and `'horizontal'`. Set the prop on the toolbar root and on any nested components that have their own orientation:

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cratis/components/Toolbar';

<Toolbar orientation='horizontal' aria-label='History'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
    <ToolbarSeparator orientation='horizontal' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Redo' />
</Toolbar>
```

`orientation` sets the layout direction and the root's `aria-orientation`. The nested layout components do not read it from the toolbar: pass the same value to `ToolbarGroup`, `ToolbarSection`, and `ToolbarLayout`, and to `ToolbarSeparator` so the rule is drawn across the toolbar direction. See [Separators](sections.md).

With the default arrow focus mode, a vertical toolbar uses Up and Down to move between tools. A horizontal toolbar uses Left and Right, reversing the forward direction in a right-to-left layout. Home and End move to the first and last available tools. Moving to an edge does not wrap to the opposite end.

Changing the layout does not change tooltip placement: buttons still default to tooltips on the right. Set `tooltipPosition='bottom'` on individual tools when that better fits a top-mounted toolbar. Choose the orientation for your available space; this prop does not automatically switch directions at a responsive breakpoint.

## See also

- [Toolbar groups](groups.md) — lay out related clusters
- [Toolbar layout](toolbar-layout.md) — orient named layout regions
- [Tooltip position](tooltip-position.md) — place labels beside their triggers
