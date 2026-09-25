---
title: Multiple toolbar groups
description: Stack several Toolbar instances to build a multi-panel tool palette.
---

Render multiple `Toolbar` instances to create separate groups, matching the style of canvas-based tools panels. Components ships no layout utility classes, so arrange the toolbars with your own CSS or an inline style:

```tsx
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

Each `Toolbar` renders its own `role='toolbar'` element. Give each one its own `aria-label` so a screen reader can tell them apart; without one, every toolbar is named `Tools`. To keep related tools inside one toolbar instead, use [`ToolbarGroup`](groups.md).
