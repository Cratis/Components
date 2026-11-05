---
title: Arrange separate Toolbar palettes
description: Use multiple Toolbar instances for palettes with separate names and keyboard navigation, or ToolbarGroup for clusters within one toolbar.
---

Use multiple `Toolbar` instances when a canvas needs palettes for distinct tasks, such as selecting tools and undoing changes, with keyboard navigation kept inside each palette. If users should move between clusters with the arrow keys, keep them in one `Toolbar` and use `ToolbarGroup` to separate them visually.

Stack the palettes with your own layout CSS or an inline style. Here, the outer flex container places Selection tools above History with a gap. Both toolbars keep their default vertical orientation:

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

Each `Toolbar` renders its own `role='toolbar'` element. The distinct `aria-label` values let a screen reader tell the palettes apart. Without an explicit label, the name falls back to the provider's `messages.toolbar.label`, then `Tools`.

In this example, Up and Down move between Select and Draw, or between Undo and Redo. Arrow navigation does not cross the gap: the outer container controls layout, not keyboard navigation. With the default focus mode, each button remains a Tab stop, so users can Tab between palettes and the rest of the page. Use [`ToolbarGroup`](groups.md) within a single toolbar if the gap should only be visual.

Configure each toolbar independently. To make History horizontal while Selection tools stays vertical, set `orientation='horizontal'` on the History toolbar. Set `draggable` on each root whose children should inherit that drag default; it does not configure a sibling toolbar. Keep shared selection state in your application when tools in separate palettes operate on the same canvas.

## See also

- [Toolbar groups](groups.md) — create multiple pills inside one toolbar
- [Orientation](orientation.md) — choose each palette's direction
- [Active state](active-state.md) — keep tool selection in application state
