# DataPage - Details Panel

## Overview

The details panel displays detailed information about the selected row in a resizable side panel.

## Enabling Details Panel

Provide a `DetailsComponent` prop to enable the details panel:

```typescript
const ProductDetails = ({ item }) => (
    <div className="p-4">
        <h2>{item.name}</h2>
        <p>{item.description}</p>
        <div className="mt-4">
            <p><strong>SKU:</strong> {item.sku}</p>
            <p><strong>Price:</strong> ${item.price}</p>
            <p><strong>Stock:</strong> {item.stock} units</p>
            <p><strong>Category:</strong> {item.category}</p>
        </div>
    </div>
);

<DataPage
    title="Products"
    query={ProductsQuery}
    emptyMessage="No products"
    DetailsComponent={ProductDetails}
    detailsTitle="Product Details"
>
    {/* MenuItems and Columns */}
</DataPage>
```

## Detail Component Props

Your detail component receives:

- `item`: The selected data item

```typescript
interface DetailComponentProps<TDataType> {
    item: TDataType;
}
```

## Complex Details Example

```typescript
const OrderDetails = ({ item }) => {
    return (
        <div className="order-details p-4">
            <div className="header mb-4">
                <h2>Order #{item.orderNumber}</h2>
                <span className={`status-badge ${item.status}`}>
                    {item.status}
                </span>
            </div>
            
            <div className="section mb-4">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {item.customerName}</p>
                <p><strong>Email:</strong> {item.customerEmail}</p>
                <p><strong>Phone:</strong> {item.customerPhone}</p>
            </div>
            
            <div className="section mb-4">
                <h3>Order Items</h3>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {item.items.map(orderItem => (
                            <tr key={orderItem.id}>
                                <td>{orderItem.name}</td>
                                <td>{orderItem.quantity}</td>
                                <td>${orderItem.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="section">
                <h3>Totals</h3>
                <p><strong>Subtotal:</strong> ${item.subtotal}</p>
                <p><strong>Tax:</strong> ${item.tax}</p>
                <p><strong>Total:</strong> ${item.total}</p>
            </div>
        </div>
    );
};
```

## Panel Layout

Control the initial size split between the table and details:

```typescript
<DataPage
    title="Orders"
    query={OrdersQuery}
    emptyMessage="No orders"
    DetailsComponent={OrderDetails}
    detailsTitle="Order Details"
    initialSizes={[60, 40]}  // Table: 60%, Details: 40%
>
    {/* ... */}
</DataPage>
```

## Custom Details Title

Set a custom title for the details panel:

```typescript
<DataPage
    DetailsComponent={ProductDetails}
    detailsTitle="Product Information"
    // Or use a function for dynamic titles
    detailsTitle={(item) => `Product: ${item.name}`}
>
    {/* ... */}
</DataPage>
```

## Interactive Details

Add interactive elements in the details panel:

```typescript
const ProductDetails = ({ item }) => {
    const [editing, setEditing] = useState(false);
    
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2>{item.name}</h2>
                <Button 
                    label={editing ? "Save" : "Edit"} 
                    onClick={() => setEditing(!editing)}
                />
            </div>
            
            {editing ? (
                <div>
                    {/* Edit form */}
                    <InputText value={item.name} onChange={...} />
                </div>
            ) : (
                <div>
                    {/* Display view */}
                    <p>{item.description}</p>
                </div>
            )}
        </div>
    );
};
```

## Resizable Panels

The details panel is resizable by default using Allotment. Users can drag the divider to adjust the split.

### Disable Resizing

To disable resizing, you would need to wrap the DataPage or use custom layout.

### Remember Size

Store the user's preferred size:

```typescript
const [sizes, setSizes] = useState([60, 40]);

useEffect(() => {
    const saved = localStorage.getItem('dataPanelSizes');
    if (saved) {
        setSizes(JSON.parse(saved));
    }
}, []);

const handleSizeChange = (newSizes) => {
    setSizes(newSizes);
    localStorage.setItem('dataPanelSizes', JSON.stringify(newSizes));
};

<DataPage
    initialSizes={sizes}
    // Note: You may need to handle this through Allotment's onChange
    // ... other props
/>
```

## No Selection State

When no row is selected, the details panel is hidden automatically.

## Best Practices

1. **Keep it focused**: Display essential details, not everything
2. **Load additional data**: Use the item ID to fetch related data if needed
3. **Provide actions**: Include relevant actions (edit, delete, etc.) in the details panel
4. **Use tabs**: For complex details, organize into tabs
5. **Show relationships**: Display related items or hierarchical data
6. **Include metadata**: Creation dates, last modified, version info
7. **Make it actionable**: Add buttons for common operations
8. **Consider performance**: Lazy load heavy content or images
