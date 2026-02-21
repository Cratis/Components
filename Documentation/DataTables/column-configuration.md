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

```typescript
<Column 
    header="Actions"
    body={(rowData) => (
        <div className="flex gap-2">
            <Button 
                icon="pi pi-pencil" 
                onClick={() => handleEdit(rowData)}
                className="p-button-sm"
            />
            <Button 
                icon="pi pi-trash" 
                onClick={() => handleDelete(rowData)}
                className="p-button-sm p-button-danger"
            />
        </div>
    )}
/>
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

## Filter Types

### Text Filter

```typescript
<Column 
    field="name" 
    header="Name" 
    filter 
    filterMatchMode="contains"
/>
```

### Dropdown Filter

```typescript
<Column 
    field="status" 
    header="Status" 
    filter 
    filterElement={(options) => (
        <Dropdown 
            value={options.value} 
            options={statusOptions}
            onChange={(e) => options.filterCallback(e.value)}
            placeholder="Select Status"
        />
    )}
/>
```

### Date Filter

```typescript
<Column 
    field="createdAt" 
    header="Created" 
    filter 
    filterElement={(options) => (
        <Calendar 
            value={options.value} 
            onChange={(e) => options.filterCallback(e.value)}
        />
    )}
/>
```

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
