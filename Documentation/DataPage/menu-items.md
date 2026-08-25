# DataPage - Menu Items

## MenuItems Component

The `MenuItems` component defines the action menu for a DataPage.

## Basic Usage

```tsx
import { DataPage, MenuItem } from '@cratis/components/DataPage';
import { Column } from '@cratis/components/DataPage';
import { FaPlus, FaPencil, FaTrash } from 'react-icons/fa6';

<DataPage title='Products' query={ProductsQuery} emptyMessage='No products'>
    <DataPage.MenuItems>
        <MenuItem label='Create Product' icon={FaPlus} command={handleCreate} />
        <MenuItem label='Edit' icon={FaPencil} disableOnUnselected command={handleEdit} />
        <MenuItem
            label='Delete'
            icon={FaTrash}
            disableOnUnselected
            command={handleDelete}
        />
    </DataPage.MenuItems>

    <DataPage.Columns>{/* ... columns */}</DataPage.Columns>
</DataPage>;
```

## MenuItem Props

### Required Props

- `label`: Text displayed for the menu item
- `command`: Callback function when item is clicked

### Optional Props

- `icon`: Icon **component type** (e.g. a `react-icons` icon like `FaPlus`) — DataPage renders it as `<Icon />`, so pass the component reference, not a CSS-class string or a JSX element
- `disabled`: Disable the item unconditionally (default: false)
- `disableOnUnselected`: Disable when no row is selected (default: false)

That is the whole surface. `MenuItem` is Cratis-owned; navigation/menu-specific props such as nested `items`, `separator`, `url`, and renderer templates are not accepted.

## Context-Aware Actions

Use `disableOnUnselected` to disable actions that require a selection:

```tsx
import { FaPlus, FaPencil, FaTrash, FaBoxArchive } from 'react-icons/fa6';

<DataPage.MenuItems>
    {/* Always enabled */}
    <MenuItem
        label='Create New'
        icon={FaPlus}
        command={() => setShowCreateDialog(true)}
    />

    {/* Disabled when no selection */}
    <MenuItem
        label='Edit Selected'
        icon={FaPencil}
        disableOnUnselected={true}
        command={() => setShowEditDialog(true)}
    />

    <MenuItem
        label='Delete Selected'
        icon={FaTrash}
        disableOnUnselected={true}
        command={() => handleDelete()}
    />

    {/* Conditional actions */}
    <MenuItem
        label='Archive'
        icon={FaBoxArchive}
        disableOnUnselected={true}
        command={() => handleArchive()}
    />
</DataPage.MenuItems>;
```

## Icons

The `icon` prop takes a **component type** — DataPage renders it internally as `<Icon />`. Pass the
component reference (for example, an icon from [`react-icons`](https://react-icons.github.io/react-icons/)),
not a string CSS class and not an already-rendered JSX element.

```tsx
import { FaFloppyDisk, FaDownload, FaUpload } from 'react-icons/fa6';

<MenuItem label="Save" icon={FaFloppyDisk} command={handleSave} />
<MenuItem label="Download" icon={FaDownload} command={handleDownload} />
<MenuItem label="Upload" icon={FaUpload} command={handleUpload} />
```

:::caution
Don't pass `icon="pi pi-save"` (a PrimeIcons CSS class) or `icon={<FaFloppyDisk />}` (a JSX element).
DataPage instantiates the icon itself, so the prop must be the component type: `icon={FaFloppyDisk}`.
:::

## Accessing Selected Item

The selected item is available through the DataPage context:

```tsx
const handleEdit = () => {
    // Access selected item from parent component state
    if (selectedItem) {
        setEditItem(selectedItem);
        setShowEditDialog(true);
    }
};
```

## The menu is flat — no separators, no submenus

`DataPage.MenuItems` renders a single row of action buttons, in the order you declare them:

```tsx
import { FaPlus, FaPencil, FaTrash, FaFileExport } from 'react-icons/fa6';

<DataPage.MenuItems>
    <MenuItem label='New' icon={FaPlus} command={handleNew} />
    <MenuItem label='Edit' icon={FaPencil} disableOnUnselected command={handleEdit} />
    <MenuItem label='Delete' icon={FaTrash} disableOnUnselected command={handleDelete} />
    <MenuItem label='Export' icon={FaFileExport} command={handleExport} />
</DataPage.MenuItems>;
```

There are no separators and no submenus. A `MenuItem` with `MenuItem` children does not nest — the children are simply ignored, with no error to tell you — and `<MenuItem separator />` is not a thing.

The action bar is a flat Button toolbar because a navigation menubar is not the correct semantic pattern for a row of commands. When a page genuinely needs grouped actions, put the grouping in a dialog opened from one item, or split the page.

## Action Handlers

### Simple Actions

```tsx
const handleCreate = () => {
    setShowCreateDialog(true);
};
```

### Actions with Selected Item

```tsx
const handleEdit = () => {
    if (!selectedItem) return;

    setEditItem(selectedItem);
    setShowEditDialog(true);
};
```

### Confirmation Dialogs

```tsx
const handleDelete = () => {
    if (!selectedItem) return;

    setDeleteItem(selectedItem);
    setShowConfirmDialog(true);
};
```

### Async Actions

```tsx
const handleArchive = async () => {
    if (!selectedItem) return;

    try {
        await archiveItem(selectedItem.id);
        // Refresh data
    } catch (error) {
        console.error('Failed to archive item:', error);
    }
};
```
