# Column Configuration

Both DataTableForQuery and DataTableForObservableQuery support all PrimeReact Column features.

## Basic Column

```typescript
<Column field="name" header="Name" />
```

## Sortable Column

```typescript
<Column field="name" header="Name" sortable />
```

## Column with Filter

```typescript
<Column
    field="status"
    header="Status"
    filter
    filterPlaceholder="Search by status"
/>
```

## Custom Body Template

Display custom content in cells:

```typescript
<Column
    field="status"
    header="Status"
    body={(rowData) => (
        <span className={`badge badge-${rowData.status}`}>
            {rowData.status}
        </span>
    )}
/>
```

## Formatted Values

```typescript
<Column
    field="price"
    header="Price"
    body={(rowData) => `$${rowData.price.toFixed(2)}`}
/>

<Column
    field="createdAt"
    header="Created"
    body={(rowData) => new Date(rowData.createdAt).toLocaleDateString()}
/>
```

## Boolean Display

```typescript
<Column
    field="active"
    header="Active"
    body={(rowData) => (
        <i className={`pi ${rowData.active ? 'pi-check text-green-500' : 'pi-times text-red-500'}`} />
    )}
/>
```

## Action Buttons

PrimeReact 11's `Button` renders its content as **children** — the v10 `label` / `icon` props are gone, and severity is a `severity` prop rather than a `p-button-*` class:

```tsx
import { Button } from 'primereact/button';

<Column
    header='Actions'
    body={(rowData) => (
        <div className='flex gap-2'>
            <Button size='small' aria-label='Edit' onClick={() => handleEdit(rowData)}>
                <i className='pi pi-pencil' />
            </Button>
            <Button
                size='small'
                severity='danger'
                aria-label='Delete'
                onClick={() => handleDelete(rowData)}
            >
                <i className='pi pi-trash' />
            </Button>
        </div>
    )}
/>;
```

## Column Width

```typescript
<Column field="id" header="ID" style={{ width: '80px' }} />
<Column field="name" header="Name" style={{ width: '200px' }} />
<Column field="description" header="Description" />
```

## Alignment

```typescript
<Column
    field="price"
    header="Price"
    style={{ textAlign: 'right' }}
    headerStyle={{ textAlign: 'right' }}
/>
```

## Frozen Columns

```typescript
<Column field="id" header="ID" frozen />
<Column field="name" header="Name" frozen />
<Column field="email" header="Email" />
<Column field="phone" header="Phone" />
```

## Conditional Styling

```typescript
<Column
    field="stock"
    header="Stock"
    body={(rowData) => (
        <span className={rowData.stock < 10 ? 'text-red-500 font-bold' : ''}>
            {rowData.stock}
        </span>
    )}
/>
```

## Nested Property Access

```typescript
<Column field="user.name" header="User Name" />
<Column field="address.city" header="City" />
```

## Custom Header

```typescript
<Column
    header={
        <div className="flex align-items-center">
            <i className="pi pi-user mr-2" />
            <span>User Name</span>
        </div>
    }
    field="name"
/>
```

## Export Support

```typescript
<Column field="name" header="Name" exportable />
<Column field="internalId" header="Internal ID" exportable={false} />
```

## Column Filters

Set `filter` and choose one of the four built-in value editors with `dataType`:

| `dataType`       | Built-in editor     |
| ---------------- | ------------------- |
| `text` (default) | Text input          |
| `numeric`        | Number input        |
| `date`           | Date picker         |
| `boolean`        | True/False dropdown |

```tsx
<Column
    field='name'
    header='Name'
    filter
    filterPlaceholder='Search names'
    dataType='text'
/>
```

`defaultFilters` on the surrounding table initializes the draft once when the table mounts. Filtering is client-side over the currently loaded query page; the menu's Apply action commits its draft.

### Localize the menu

Override any of the default English labels per filtered column. Omitted labels retain their defaults:

```tsx
<Column
    field='active'
    header='Status'
    filter
    dataType='boolean'
    filterLabels={{
        filterTriggerAriaLabel: (field) => `Filtrer ${field}`,
        clear: 'Tøm',
        apply: 'Bruk',
        true: 'Ja',
        false: 'Nei',
    }}
/>
```

### Custom value editor

`filterElement` replaces only the built-in value editor. The match-mode selector and the component-owned Clear and Apply actions remain in the menu. `onChange` updates the draft; it does not apply the filter until Apply is used.

```tsx
<Column
    field='role'
    filterField='roleCode'
    header='Role'
    filter
    showFilterMatchModes={false}
    filterElement={({ value, onChange }) => (
        <Dropdown
            value={value}
            options={roleOptions}
            optionLabel='label'
            optionValue='value'
            onChange={(event) => onChange(event.value, 'equals')}
            placeholder='Select role'
        />
    )}
/>
```

The callback receives:

```typescript
interface ColumnFilterElementOptions {
    field: string; // effective filterField, or field
    value: unknown; // current draft value
    matchMode: string; // current draft match mode
    onChange(value: unknown, matchMode?: string): void;
    onApply(event: React.SyntheticEvent): void;
    onClear(event: React.SyntheticEvent): void;
}
```

Use `onApply` / `onClear` when the custom editor needs its own action buttons; otherwise use the menu's built-in actions.

## Advanced Templates

### Status Badge

```typescript
const statusBodyTemplate = (rowData) => {
    const statusColors = {
        active: 'success',
        pending: 'warning',
        inactive: 'danger'
    };

    return (
        <Tag
            value={rowData.status}
            severity={statusColors[rowData.status]}
        />
    );
};

<Column
    field="status"
    header="Status"
    body={statusBodyTemplate}
/>
```

### Image Display

```typescript
<Column
    header="Avatar"
    body={(rowData) => (
        <img
            src={rowData.avatarUrl}
            alt={rowData.name}
            width="40"
            height="40"
            className="rounded-full"
        />
    )}
/>
```

### Progress Bar

```typescript
<Column
    field="progress"
    header="Progress"
    body={(rowData) => (
        <ProgressBar value={rowData.progress} />
    )}
/>
```

## Best Practices

1. **Use dataKey**: Always specify a dataKey for better performance
2. **Keep templates simple**: Complex calculations should be done outside render
3. **Memoize callbacks**: Use useCallback for event handlers in templates
4. **Limit columns**: Too many columns hurt usability
5. **Make important columns first**: Put key information on the left
6. **Use appropriate widths**: Don't let long content break layout
7. **Filter strategically**: Add filters to commonly searched fields
8. **Sort by default**: Consider default sorting on key column
