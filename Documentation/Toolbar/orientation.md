---
title: Orientation
description: Lay a Toolbar out vertically or horizontally.
---

The toolbar defaults to `vertical`. Pass `orientation='horizontal'` for a horizontal layout:

```tsx
<Toolbar orientation='horizontal'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Undo' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Redo' />
</Toolbar>
```

`orientation` sets the layout direction and the root's `aria-orientation`. The nested layout components do not read it from the toolbar: pass the same value to `ToolbarGroup`, `ToolbarSection`, and `ToolbarLayout`, and to `ToolbarSeparator` so the rule is drawn across the toolbar direction. See [Separators](sections.md).
