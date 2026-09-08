# Expandable Folder

`ToolbarFolder` replaces a regular button with one that reveals a dynamically sized grid of buttons when clicked. The folder animates open to reveal its contents and closes when clicking the button again or anywhere outside the panel.

The grid automatically balances rows and columns based on item count, keeping the folder compact for small sets while naturally expanding for larger collections.

```tsx
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
    ...
</ToolbarFolder>
```

## Grid Layout

The folder automatically computes the number of columns based on the item count:

- **1 item:** 1 column × 1 row
- **4 items:** 2 columns × 2 rows
- **9 items:** 3 columns × 3 rows
- **16+ items:** Up to 5 columns (default limit) with multiple rows

Use `maxColumns` to customize the maximum column count:

```tsx
<ToolbarFolder icon={<span aria-hidden='true'>◆</span>} title='More tools' maxColumns={4}>
    ...
</ToolbarFolder>
```

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

Set `mode='list'` to change the folder's panel layout from a grid into a vertical list. In list mode, each button renders its icon and tooltip text side by side as a labeled row — no tooltip hover needed.

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
