---
title: Toolbar folders for extra tools
description: Group extra toolbar tools in a compact grid or labeled list with ToolbarFolder, and choose how the panel opens and closes.
---

Use `ToolbarFolder` in Cratis Components to keep less frequent tools behind one trigger without removing them from the toolbar. It opens a compact grid by default. Choose a labeled list when users need to read tool names, or a [headed drawer](drawer.md) for a category of labeled tiles.

For a compact folder, supply `icon`, `title`, and `children`. The title names both the trigger and its `role='group'` panel, and serves as the trigger's tooltip. The grid balances its rows and columns from the number of children.

```tsx
import { Toolbar, ToolbarButton, ToolbarFolder } from '@cratis/components/Toolbar';

<Toolbar>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Select' />
    <ToolbarFolder icon={<span aria-hidden='true'>◆</span>} title='More tools'>
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Info' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Preview' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' />
        <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Open' />
    </ToolbarFolder>
</Toolbar>
```

Click the trigger again, click outside the folder, or press Escape to close it. Escape returns focus to the trigger; an outside press does not. Opening the panel does not move focus into it, and activating a child button does not automatically close a compact folder. The trigger exposes `aria-expanded` and `aria-controls`; the collapsed panel is `inert` and `aria-hidden`, keeping its tools out of keyboard navigation.

By default the folder opens to the right. Use `folderDirection='left'` when the toolbar is positioned on the right side of the screen:

```tsx
<ToolbarFolder icon={<span aria-hidden='true'>◆</span>} title='More tools' folderDirection='left'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Open' />
</ToolbarFolder>
```

## Grid Layout

The folder uses the square root of the item count, rounded up, as the column count, capped by `maxColumns`:

| Items | Columns with the default maximum |
|---|---|
| 1 | 1 |
| 2–4 | 2 |
| 5–9 | 3 |
| 10–16 | 4 |
| 17 or more | 5, with as many rows as needed |

Use `maxColumns` to customize the maximum column count:

```tsx
<ToolbarFolder icon={<span aria-hidden='true'>◆</span>} title='More tools' maxColumns={4}>
    {tools.map((tool) => (
        <ToolbarButton key={tool.id} icon={tool.icon} title={tool.name} />
    ))}
</ToolbarFolder>
```

Here `tools` is your own array of tool descriptors.

## ReactNode Icons

Like `ToolbarButton`, the `icon` prop accepts a `string | ReactNode`. Pass any React element as the trigger icon:

```tsx
import { FaFolder } from 'react-icons/fa6';

<ToolbarFolder icon={<FaFolder />} title='More tools'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Open' />
</ToolbarFolder>
```

See [Icon](../Common/icon.md) for the shared `Icon` type and `IconDisplay` component.

## List Mode

Set `mode='list'` to change the folder's panel layout from a grid into a vertical list. In list mode, each button renders its icon and `title` side by side as a labeled row, without a floating tooltip.

```tsx
<ToolbarFolder icon={<span aria-hidden='true'>◆</span>} title='Tools' mode='list'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Draw freehand' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Rectangle' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Ellipse' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Straight line' />
</ToolbarFolder>
```

The `maxColumns` prop is ignored in list mode because the panel always uses a single column.

| Mode | Layout | Best for |
|---|---|---|
| `'grid'` (default) | Square grid, auto-sized columns | Icon-only tools where the icon is self-explanatory |
| `'list'` | Single column, icon + label | Tools that need a readable name alongside the icon |

## Headed drawer

Set `presentation='drawer'` when the category needs a visible heading, a close button, and labeled tiles supplied from data. Follow [Headed drawer](drawer.md) to wire activation and optional dragging to your application. For a simple strip of related buttons that can open in four directions, use a [fan-out panel](fan-out.md).
