---
title: DataPage menu items
description: Declare the DataPage action toolbar, disable actions until a row is selected, and act on the selected row.
---

## MenuItems Component

`DataPage.MenuItems` declares the action toolbar at the top of a DataPage. Its children are `MenuItem` markers; each one becomes a button in a single row, in the order you declare them. Leave `DataPage.MenuItems` out and the page has no toolbar.

## Basic Usage

```tsx
import { DataPage, MenuItem, Column } from '@cratis/components/DataPage';
import { FaPlus, FaPencil, FaTrash } from 'react-icons/fa6';

<DataPage title='Authors' query={AllAuthors} emptyMessage='No authors found'>
    <DataPage.MenuItems>
        <MenuItem label='Add' icon={FaPlus} command={addAuthor} />
        <MenuItem label='Edit' icon={FaPencil} disableOnUnselected command={editAuthor} />
        <MenuItem label='Remove' icon={FaTrash} disableOnUnselected command={removeAuthor} />
    </DataPage.MenuItems>

    <DataPage.Columns>
        <Column field='name' header='Name' sortable />
    </DataPage.Columns>
</DataPage>;
```

This is an excerpt: `AllAuthors` is a generated query proxy, and `addAuthor`, `editAuthor`, and `removeAuthor` are your own handlers. [Accessing Selected Item](#accessing-selected-item) shows how the handlers get the selected row. `MenuItem` is also available as `DataPage.MenuItem`.

## MenuItem Props

Every prop is optional in the type, but an item without `label` renders an unnamed button and an item without `command` does nothing when clicked, so treat both as required.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Button text, and the button's accessible name |
| `command` | `() => void` | — | Called when the button is activated. Receives no arguments. |
| `icon` | `React.ComponentType<{ className?: string }>` | — | Icon **component type** rendered before the label, for example a `react-icons` icon such as `FaPlus` |
| `disabled` | `boolean` | `false` | Disables the item regardless of selection |
| `disableOnUnselected` | `boolean` | `false` | Disables the item while no row is selected (in `selectionMode='multiple'`, while the selected set is empty) |

That is the whole surface. `MenuItem` is Cratis-owned; navigation/menu-specific props such as nested `items`, `separator`, `url`, and renderer templates are not accepted.

## Context-Aware Actions

Use `disableOnUnselected` for actions that need a row. The item is disabled while nothing is selected and enabled as soon as the user selects a row:

```tsx
import { FaPlus, FaPencil, FaTrash, FaBoxArchive } from 'react-icons/fa6';

<DataPage.MenuItems>
    {/* Always enabled */}
    <MenuItem label='Create New' icon={FaPlus} command={() => setShowCreateDialog(true)} />

    {/* Disabled when no row is selected */}
    <MenuItem label='Edit Selected' icon={FaPencil} disableOnUnselected command={() => setShowEditDialog(true)} />
    <MenuItem label='Delete Selected' icon={FaTrash} disableOnUnselected command={handleDelete} />
    <MenuItem label='Archive' icon={FaBoxArchive} disableOnUnselected command={handleArchive} />
</DataPage.MenuItems>;
```

`disableOnUnselected` follows the same selection DataPage uses for its table and details pane, including a controlled `selection`. Combine it with `disabled` when an action has another precondition, for example `disabled={!canArchive}`; either condition disables the item.

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

:::caution[Pass an icon component]
Don't pass `icon="pi pi-save"` (a PrimeIcons CSS class) or `icon={<FaFloppyDisk />}` (a JSX element).
DataPage instantiates the icon itself, so the prop must be the component type: `icon={FaFloppyDisk}`.
:::

DataPage passes a `className` to the icon for spacing, so a custom icon component should accept `className` and put it on its root element.

## Accessing Selected Item

`command` is called with no arguments, and DataPage does not expose its selection through a hook or context. Keep the selected row in your own state from `onSelectionChange`, then read that state in your handlers:

```tsx
import { useState } from 'react';
import { DataPage, MenuItem, Column } from '@cratis/components/DataPage';
import { FaPencil } from 'react-icons/fa6';
import { AllAuthors, type Author } from './Author'; // generated Arc query proxy and read model

export function Authors() {
    const [selected, setSelected] = useState<Author | null>(null);

    const editAuthor = () => {
        if (!selected) return;
        // open your edit dialog for `selected` here
    };

    return (
        <div style={{ height: '100vh' }}>
            <DataPage<AllAuthors, Author, object>
                title='Authors'
                query={AllAuthors}
                emptyMessage='No authors found'
                dataKey='id'
                onSelectionChange={(event) => setSelected(event.value)}
            >
                <DataPage.MenuItems>
                    <MenuItem label='Edit' icon={FaPencil} disableOnUnselected command={editAuthor} />
                </DataPage.MenuItems>
                <DataPage.Columns>
                    <Column field='name' header='Name' sortable />
                </DataPage.Columns>
            </DataPage>
        </div>
    );
}
```

The explicit type arguments give `event.value` the type `Author | null`; without them it is `object | null`. If you also need to set or clear the selection yourself, pass `selection={selected}` as well to make it controlled. See [DataPage selection](index.md#selection).

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

There are no separators and no submenus. A `MenuItem` with `MenuItem` children does not nest — the children are ignored, with no error to tell you — and `<MenuItem separator />` is not a thing. Children of `DataPage.MenuItems` that are not `MenuItem` elements, such as a wrapper component that renders a `MenuItem`, are ignored too.

The action bar is a flat Button toolbar because a navigation menubar is not the correct semantic pattern for a row of commands. When a page genuinely needs grouped actions, put the grouping in a dialog opened from one item, or split the page.

## Accessibility

The toolbar renders with `role="toolbar"` and the accessible name from DataPage's `actionsAriaLabel` prop, which defaults to `'Actions'`; localize it there. Each item is a native button named by its `label`, and a disabled item is a disabled button. Style the buttons through DataPage's `menubarPt` and `menubarClassName`.

## Action Handlers

The handlers below read `selectedItem` from your own selection state, as shown in [Accessing Selected Item](#accessing-selected-item).

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

`command` is typed `() => void`, so DataPage does not await a returned promise and does not disable the button while it runs. Guard against repeated clicks yourself if the action must not run twice:

```tsx
const handleArchive = async () => {
    if (!selectedItem) return;

    try {
        await archiveItem(selectedItem.id);
        // An observable query updates the table on its own
    } catch (error) {
        console.error('Failed to archive item:', error);
    }
};
```
