---
title: Expandable folder
description: Reveal a grid or list of extra tools from a ToolbarFolder trigger.
---

`ToolbarFolder` replaces a regular button with one that reveals a dynamically sized grid of buttons when clicked. The folder animates open to reveal its contents and closes when you click the trigger again, press anywhere outside the panel, or press Escape; Escape also returns focus to the trigger.

`icon`, `title`, and `children` are required. `title` is the trigger's accessible name and tooltip, and also names the panel, which renders as a `role='group'`. The trigger exposes `aria-expanded` and `aria-controls`, and the collapsed panel is `inert`.

The grid automatically balances rows and columns based on item count, keeping the folder compact for small sets while naturally expanding for larger collections.

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

By default the folder opens to the right. Use `folderDirection='left'` when the toolbar is positioned on the right side of the screen:

```tsx
<ToolbarFolder icon={<span aria-hidden='true'>◆</span>} title='More tools' folderDirection='left'>
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Settings' />
    <ToolbarButton icon={<span aria-hidden='true'>◆</span>} title='Open' />
</ToolbarFolder>
```

## Grid Layout

The folder uses the square root of the item count, rounded up, as the column count, capped by `maxColumns`:

- **1 item:** 1 column × 1 row
- **2–4 items:** 2 columns
- **5–9 items:** 3 columns
- **10–16 items:** 4 columns
- **17 or more items:** 5 columns (the default `maxColumns`), with as many rows as needed

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

The `maxColumns` prop is ignored in list mode — the panel always uses a single column.

| Mode | Layout | Best for |
|---|---|---|
| `'grid'` (default) | Square grid, auto-sized columns | Icon-only tools where the icon is self-explanatory |
| `'list'` | Single column, icon + label | Tools that need a readable name alongside the icon |
