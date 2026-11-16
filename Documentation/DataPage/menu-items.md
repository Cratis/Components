---
title: DataPage menu items for row actions
description: "Add DataPage toolbar actions that receive the current selection and use selection predicates to control when each action is available to the user."
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

In this excerpt, `AllAuthors` is a generated query proxy and the three handlers belong to your page. **Add** is available immediately; **Edit** and **Remove** become available after a row is selected. Commands receive the current selection: [Accessing Selected Item](#accessing-selected-item) shows how to use it without mirroring page state. `MenuItem` is also available as `DataPage.MenuItem`.

## MenuItem Props

Give each item a `label` so users can identify it and a `command` so activating it does something. Both are optional in the type, but an item without them is unnamed or inactive.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Button text, and the button's accessible name |
| `command` | `(selection: DataPageSelection<TDataType>) => void` | — | Called with the current immutable selection snapshot when the enabled button is activated. Existing no-argument handlers remain valid. |
| `icon` | `React.ComponentType<{ className?: string }>` | — | Icon **component type** rendered before the label, for example a `react-icons` icon such as `FaPlus` |
| `disabled` | `boolean \| ((selection: DataPageSelection<TDataType>) => boolean)` | `false` | Disables the item when the boolean or selection predicate is true |
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

An action may also depend on another condition. Set `disabled={!canArchive}`, for example, or supply a predicate that reads the current selection. The predicate is evaluated during rendering and must be pure. The effective disabled state is the boolean/predicate result **or** `disableOnUnselected` with an empty selection. A false result cannot override the empty-selection rule, and a disabled action never dispatches its command.

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

Use the `selection` argument to read the row already owned by DataPage. Supply the **same row type as the surrounding page** explicitly on each marker (`<MenuItem<Author>>` or `<DataPage.MenuItem<Author>>`): JSX parent generics do not flow into arbitrary child elements. Without that type argument, rows are typed as `object`. The parent cannot verify that a marker's explicit type matches its query, so keep them aligned.

The public `DataPageSelection<TDataType>` type is exported from `@cratis/components/DataPage`. Narrow its `selectionMode` discriminator before accessing `selectedItem` or `selectedItems`:

```tsx
import { DataPage, MenuItem, Column, type DataPageSelection } from '@cratis/components/DataPage';
import { FaPencil } from 'react-icons/fa6';
import { AllAuthors, type Author } from './Author'; // generated Arc query proxy and read model

export function Authors() {
    const editAuthor = (selection: DataPageSelection<Author>) => {
        if (selection.selectionMode !== 'single' || !selection.selectedItem) return;
        // open your edit dialog for `selection.selectedItem` here
    };

    return (
        <div style={{ height: '100vh' }}>
            <DataPage<AllAuthors, Author, object>
                title='Authors'
                query={AllAuthors}
                emptyMessage='No authors found'
                dataKey='id'
            >
                <DataPage.MenuItems>
                    <MenuItem<Author> label='Edit' icon={FaPencil} disableOnUnselected
                        disabled={(selection) => selection.selectionMode === 'single' && !selection.selectedItem}
                        command={editAuthor} />
                </DataPage.MenuItems>
                <DataPage.Columns>
                    <Column field='name' header='Name' sortable />
                </DataPage.Columns>
            </DataPage>
        </div>
    );
}
```

In single mode, the snapshot has `readonly selectedItem: Author | null | undefined`. In multiple mode, it has `readonly selectedItems: readonly Author[]`, independent of the single item shown in the details pane:

```tsx
<MenuItem<Author> label='Review selected authors' disableOnUnselected
    disabled={(selection) => selection.selectionMode === 'multiple' && selection.selectedItems.length > 10}
    command={(selection) => {
        if (selection.selectionMode !== 'multiple') return;
        // open your review dialog for `selection.selectedItems` here
    }} />
```

Both the snapshot container and its copied multiple-selection array are frozen; application row objects are **not** deep-frozen. Keep the null/empty guard in handlers. Switching between selected rows updates both the predicate and command payload, even when the selected count is unchanged.

Snapshots follow the page's existing committed selection rules. Uncontrolled single selection follows query-row replacement/removal; multiple selection retains the existing selected set until it changes. For controlled `selection` or `selectedItems`, a proposed table change is not exposed until the parent supplies its accepted value. You can still lift selection through the existing callbacks when other UI needs it; no public context, clear-selection helper, or automatic bulk execution is added. See [DataPage selection](index.md#selection).

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

The handlers below use `DataPageSelection<Author>` imported from `@cratis/components/DataPage`, as shown in [Accessing Selected Item](#accessing-selected-item). Pair them with `<MenuItem<Author>>`.

### Simple Actions

```tsx
const handleCreate = () => {
    setShowCreateDialog(true);
};
```

### Actions with Selected Item

```tsx
const handleEdit = (selection: DataPageSelection<Author>) => {
    if (selection.selectionMode !== 'single' || !selection.selectedItem) return;

    setEditItem(selection.selectedItem);
    setShowEditDialog(true);
};
```

### Confirmation Dialogs

A confirmation dialog lets the user reconsider; it does not authorize the command. The backend must still authorize the operation and validate its current target, even if the action was enabled and the user confirmed it. Hiding or disabling the action is not a security check either.

```tsx
const handleDelete = (selection: DataPageSelection<Author>) => {
    if (selection.selectionMode !== 'single' || !selection.selectedItem) return;

    setDeleteItem(selection.selectedItem);
    setShowConfirmDialog(true);
};
```

### Async Actions

DataPage invokes `command` without awaiting a returned promise. Handle errors in your async handler and manage pending state yourself if repeated clicks could submit the same operation twice. The example below catches failures, but does not yet guard repeated clicks:

```tsx
const handleArchive = async (selection: DataPageSelection<Author>) => {
    if (selection.selectionMode !== 'single' || !selection.selectedItem) return;

    try {
        await archiveItem(selection.selectedItem.id);
        // An observable query updates the table on its own
    } catch (error) {
        console.error('Failed to archive item:', error);
    }
};
```
