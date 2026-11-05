---
title: DataPage menu items for row actions
description: Add actions to a DataPage toolbar, enable them when rows are selected, and pass the selected record from your state to a dialog or command.
---

## MenuItems Component

`DataPage.MenuItems` adds toolbar actions for the list or its selected rows, such as adding an author or editing the one the user chose. Declare each action as a `MenuItem` child; DataPage renders the buttons in that order and wraps them when space is tight. Omit `DataPage.MenuItems` when the page needs no toolbar.

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

In this excerpt, `AllAuthors` is a generated query proxy and the three handlers belong to your page. **Add** is available immediately; **Edit** and **Remove** become available after a row is selected. The buttons do not receive that row as a command argument: [Accessing Selected Item](#accessing-selected-item) shows how to retain it for your handlers. `MenuItem` is also available as `DataPage.MenuItem`.

## MenuItem Props

Give each item a `label` so users can identify it and a `command` so activating it does something. Both are optional in the type, but an item without them is unnamed or inactive.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Button text, and the button's accessible name |
| `command` | `() => void` | — | Called when the button is activated. Receives no arguments. |
| `icon` | `React.ComponentType<{ className?: string }>` | — | Icon **component type** rendered before the label, for example a `react-icons` icon such as `FaPlus` |
| `disabled` | `boolean` | `false` | Disables the item regardless of selection |
| `disableOnUnselected` | `boolean` | `false` | Disables the item while no row is selected (in `selectionMode='multiple'`, while the selected set is empty) |

These are the only props supported by the Cratis `MenuItem`. It does not accept navigation-menu props such as nested `items`, `separator`, `url`, or renderer templates.

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

With single selection, `disableOnUnselected` follows the selected row, including a controlled `selection`. With multiple selection, it follows whether `selectedItems` is empty, not the separate single row used by the details pane.

An action may also depend on another condition. Set `disabled={!canArchive}`, for example, to keep archive unavailable even after a row is selected. Either condition can disable the button; `disabled={false}` cannot override a missing selection.

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

Keep the row reported by `onSelectionChange` in your own state, then read that state when the action runs. `command` receives no arguments, and there is no public selection hook or context to read instead:

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

:::note[Selection is not a command argument]
The handler closes over your state; DataPage does not pass the selected row to `command`. Keep the null guard even when the button uses `disableOnUnselected`.
:::

For multiple selection, retain the set from `onSelectedItemsChange`, use `selectedItems` if controlling it, and guard an empty set in the handler. That set is independent of the single item shown in the details pane.

For a selection-aware dialog, follow the [Add book handoff](../tutorial/list-and-detail.mdx#check-the-selection-handoff) from the selected author id to the dialog's `initialValues`.

## The menu is flat — no separators, no submenus

Put each action directly inside `DataPage.MenuItems`. The toolbar preserves their order and wraps buttons onto another line when needed:

```tsx
import { FaPlus, FaPencil, FaTrash, FaFileExport } from 'react-icons/fa6';

<DataPage.MenuItems>
    <MenuItem label='New' icon={FaPlus} command={handleNew} />
    <MenuItem label='Edit' icon={FaPencil} disableOnUnselected command={handleEdit} />
    <MenuItem label='Delete' icon={FaTrash} disableOnUnselected command={handleDelete} />
    <MenuItem label='Export' icon={FaFileExport} command={handleExport} />
</DataPage.MenuItems>;
```

There are no separators or submenus. Nested `MenuItem` children are silently ignored, and `<MenuItem separator />` is unsupported. A fragment or custom component also hides its items from DataPage, so their buttons do not appear. A condition that returns a `MenuItem` directly works; an absent child adds no action.

These buttons perform commands rather than navigate a menu, so the action bar uses toolbar semantics. If users need to choose among grouped actions, open a dialog from one item or give those tasks their own page.

## Accessibility

Name the toolbar with DataPage's `actionsAriaLabel` prop, which defaults to `'Actions'`. It renders with `role="toolbar"`; each item is a native button named by its `label`. Disabled buttons are skipped during keyboard navigation. Enabled buttons remain reachable with Tab, and the toolbar also supports Left/Right arrows, Home, and End.

Localize both the toolbar name and the individual labels. Style the buttons through DataPage's `menubarPt` and `menubarClassName`.

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

A confirmation dialog lets the user reconsider; it does not authorize the command. The backend must still authorize the operation and validate its current target, even if the action was enabled and the user confirmed it. Hiding or disabling the action is not a security check either.

```tsx
const handleDelete = () => {
    if (!selectedItem) return;

    setDeleteItem(selectedItem);
    setShowConfirmDialog(true);
};
```

### Async Actions

DataPage invokes `command` without awaiting a returned promise. Handle errors in your async handler and manage pending state yourself if repeated clicks could submit the same operation twice. The example below catches failures, but does not yet guard repeated clicks:

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
