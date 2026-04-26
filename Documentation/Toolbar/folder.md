# Expandable Folder

`ToolbarFolder` replaces a regular button with one that reveals a dynamically sized grid of buttons when clicked. The folder animates open to reveal its contents and closes when clicking the button again or anywhere outside the panel.

The grid automatically balances rows and columns based on item count, keeping the folder compact for small sets while naturally expanding for larger collections.

```tsx
<Toolbar>
    <ToolbarButton icon='pi pi-arrow-up-left' tooltip='Select' />
    <ToolbarFolder icon='pi pi-th-large' tooltip='More tools'>
        <ToolbarButton icon='pi pi-exclamation-circle' tooltip='Info' />
        <ToolbarButton icon='pi pi-eye' tooltip='Preview' />
        <ToolbarButton icon='pi pi-cog' tooltip='Settings' />
        <ToolbarButton icon='pi pi-external-link' tooltip='Open' />
    </ToolbarFolder>
</Toolbar>
```

By default the folder opens to the right. Use `folderDirection='left'` when the toolbar is positioned on the right side of the screen:

```tsx
<ToolbarFolder icon='pi pi-th-large' tooltip='More tools' folderDirection='left'>
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
<ToolbarFolder icon='pi pi-th-large' tooltip='More tools' maxColumns={4}>
    ...
</ToolbarFolder>
```

## ReactNode Icons

Like `ToolbarButton`, the `icon` prop accepts a `string | ReactNode`. Pass any React element as the trigger icon:

```tsx
import { FaFolder } from 'react-icons/fa6';

<ToolbarFolder icon={<FaFolder />} tooltip='More tools'>
    <ToolbarButton icon='pi pi-cog' tooltip='Settings' />
    <ToolbarButton icon='pi pi-external-link' tooltip='Open' />
</ToolbarFolder>
```

See [Icon](../../Common/icon.md) for the shared `Icon` type and `IconDisplay` component.
