---
title: Multiple toolbar groups
description: Stack several Toolbar instances to build a multi-panel tool palette.
---

Render multiple `Toolbar` instances when a canvas needs separate tool palettes, each with its own accessible name and keyboard navigation boundary. Use `ToolbarGroup` instead when the clusters belong to one toolbar.

Arrange the separate palettes with your own layout CSS or an inline style. In this example both toolbars retain the default vertical orientation, while the outer flex container stacks the palettes with a gap:

```tsx
import { Toolbar, ToolbarButton } from '@cratis/components/Toolbar';

<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <Toolbar aria-label='Selection tools'>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw' />
    </Toolbar>
    <Toolbar aria-label='History'>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Redo' />
    </Toolbar>
</div>
```

Each `Toolbar` renders its own `role='toolbar'` element. Give each one its own `aria-label` so a screen reader can tell them apart; without one, the name falls back to the provider's `messages.toolbar.label`, then `Tools`. To keep related tools inside one toolbar instead, use [`ToolbarGroup`](groups.md).

The outer container is only a layout element; it does not join the toolbars into one keyboard surface. Arrow navigation stays within the toolbar containing the focused tool. With the default focus mode, each tool remains a Tab stop, so users can Tab between the palettes and the rest of the page.

Configure each toolbar independently. For example, a horizontal history palette and a vertical selection palette need different `orientation` values. Likewise, set `draggable` on each root that should provide a drag default to its own children; one root does not configure its sibling. Keep shared selection state in your application when tools in separate palettes operate on the same canvas.

## See also

- [Toolbar groups](groups.md) — create multiple pills inside one toolbar
- [Orientation](orientation.md) — choose each palette's direction
- [Active state](active-state.md) — keep tool selection in application state
