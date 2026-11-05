---
title: Toolbar orientation and keyboard direction
description: Set Toolbar orientation for a side palette or a horizontal row. Match nested layouts and separators, then position tooltips separately.
---

`Toolbar` orientation controls both the direction of a tool palette and its arrow-key navigation. Keep the default `vertical` layout for a side palette, or use `horizontal` for a row of canvas tools.

The supported values are `'vertical'` and `'horizontal'`. Set the prop on the toolbar root and on any nested components that have their own orientation:

```tsx
import { Toolbar, ToolbarButton, ToolbarSeparator } from '@cratis/components/Toolbar';

<Toolbar orientation='horizontal' aria-label='History'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
    <ToolbarSeparator orientation='horizontal' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Redo' />
</Toolbar>
```

In this example, the buttons form a row and the separator draws a vertical rule between them. The root also exposes `aria-orientation='horizontal'` to assistive technology.

Nested components do not inherit this setting. Pass the same `orientation` to `ToolbarGroup`, `ToolbarSection`, and `ToolbarLayout` to keep their children aligned with the palette. `ToolbarSeparator` also needs the toolbar's orientation, even though its line runs across that direction. See [Separators](sections.md).

With arrow-key navigation enabled, a vertical toolbar uses Up and Down to move focus between tools. A horizontal toolbar uses Left and Right, reversing the forward direction in a right-to-left layout. Home and End move to the first and last available tools. Focus stops at an edge without wrapping. Moving focus does not select a tool; connect selection through [Active state](active-state.md).

Choose the orientation for the space available around your canvas. The prop does not automatically switch directions at a responsive breakpoint. Tooltip placement is separate: labels still default to the right. For a top-mounted palette, set `tooltipPosition='bottom'` on individual tools to place labels below the row.

## See also

- [Toolbar groups](groups.md) — lay out related clusters
- [Toolbar layout](toolbar-layout.md) — orient named layout regions
- [Tooltip position](tooltip-position.md) — place labels beside their triggers
