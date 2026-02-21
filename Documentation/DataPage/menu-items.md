# DataPage - Menu Items

## MenuItems Component

The `MenuItems` component defines the action menu for a DataPage.

## Basic Usage

```typescript
<DataPage title="Products" query={ProductsQuery} emptyMessage="No products">
    <MenuItems>
        <MenuItem label="Create Product" icon="pi pi-plus" command={handleCreate} />
        <MenuItem label="Edit" icon="pi pi-pencil" disableOnUnselected command={handleEdit} />
        <MenuItem label="Delete" icon="pi pi-trash" disableOnUnselected command={handleDelete} />
    </MenuItems>
    
    <Columns>
        {/* ... columns */}
    </Columns>
</DataPage>
```

## MenuItem Props

### Required Props

- `label`: Text displayed for the menu item
- `command`: Callback function when item is clicked

### Optional Props

- `icon`: Icon component or CSS class
- `disableOnUnselected`: Disable when no row is selected (default: false)
- All PrimeReact MenuItem props are supported

## Context-Aware Actions

Use `disableOnUnselected` to disable actions that require a selection:

```typescript
<MenuItems>
    {/* Always enabled */}
    <MenuItem 
        label="Create New" 
        icon="pi pi-plus"
        command={() => setShowCreateDialog(true)}
    />
    
    {/* Disabled when no selection */}
    <MenuItem 
        label="Edit Selected" 
        icon="pi pi-pencil"
        disableOnUnselected={true}
        command={() => setShowEditDialog(true)}
    />
    
    <MenuItem 
        label="Delete Selected" 
        icon="pi pi-trash"
        disableOnUnselected={true}
        command={() => handleDelete()}
    />
    
    {/* Conditional actions */}
    <MenuItem 
        label="Archive" 
        icon="pi pi-archive"
        disableOnUnselected={true}
        command={() => handleArchive()}
    />
</MenuItems>
```

## Icons

### PrimeReact Icons

```typescript
<MenuItem label="Save" icon="pi pi-save" command={handleSave} />
<MenuItem label="Download" icon="pi pi-download" command={handleDownload} />
<MenuItem label="Upload" icon="pi pi-upload" command={handleUpload} />
```

### React Icons

```typescript
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

<MenuItem label="Create" icon={<FaPlus />} command={handleCreate} />
<MenuItem label="Edit" icon={<FaEdit />} command={handleEdit} />
<MenuItem label="Delete" icon={<FaTrash />} command={handleDelete} />
```

## Accessing Selected Item

The selected item is available through the DataPage context:

```typescript
const handleEdit = () => {
    // Access selected item from parent component state
    if (selectedItem) {
        setEditItem(selectedItem);
        setShowEditDialog(true);
    }
};
```

## Separators and Grouping

Use PrimeReact MenuItem features for separators:

```typescript
<MenuItems>
    <MenuItem label="New" icon="pi pi-plus" command={handleNew} />
    <MenuItem separator />
    <MenuItem label="Edit" icon="pi pi-pencil" disableOnUnselected command={handleEdit} />
    <MenuItem label="Delete" icon="pi pi-trash" disableOnUnselected command={handleDelete} />
    <MenuItem separator />
    <MenuItem label="Export" icon="pi pi-file-export" command={handleExport} />
</MenuItems>
```

## Dropdown Menus

Create nested menu structures:

```typescript
<MenuItems>
    <MenuItem label="File" icon="pi pi-file">
        <MenuItem label="New" icon="pi pi-plus" command={handleNew} />
        <MenuItem label="Open" icon="pi pi-folder-open" command={handleOpen} />
    </MenuItem>
    
    <MenuItem label="Edit" icon="pi pi-pencil">
        <MenuItem label="Copy" icon="pi pi-copy" command={handleCopy} />
        <MenuItem label="Paste" icon="pi pi-clipboard" command={handlePaste} />
    </MenuItem>
</MenuItems>
```

## Action Handlers

### Simple Actions

```typescript
const handleCreate = () => {
    setShowCreateDialog(true);
};
```

### Actions with Selected Item

```typescript
const handleEdit = () => {
    if (!selectedItem) return;
    
    setEditItem(selectedItem);
    setShowEditDialog(true);
};
```

### Confirmation Dialogs

```typescript
const handleDelete = () => {
    if (!selectedItem) return;
    
    setDeleteItem(selectedItem);
    setShowConfirmDialog(true);
};
```

### Async Actions

```typescript
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
