# TimeMachine - Configuration

## Props

### Required Props

- `versions`: Array of version objects containing timestamp, readModel, and events

### Optional Props

- `currentVersionIndex`: Initial version index (default: 0)
- `onVersionChange`: Callback when version changes
- `scrollSensitivity`: Scroll distance required to change versions (default: 50)

## Version Structure

Each version in the `versions` array should have:

```typescript
{
    timestamp: Date;           // When this version was created
    readModel: object;         // The state of the read model at this time
    events?: Array<{           // Events that led to this version
        type: string;          // Event type name
        timestamp: Date;       // When the event occurred
        data: object;          // Event payload
    }>;
}
```

## Complete Example

```typescript
const versions = [
    {
        timestamp: new Date('2024-01-01T10:00:00'),
        readModel: {
            id: 'product-1',
            name: 'Product A',
            price: 99.99,
            status: 'draft',
            category: 'Electronics'
        },
        events: [
            {
                type: 'ProductCreated',
                timestamp: new Date('2024-01-01T10:00:00'),
                data: {
                    name: 'Product A',
                    category: 'Electronics'
                }
            }
        ]
    },
    {
        timestamp: new Date('2024-01-05T14:30:00'),
        readModel: {
            id: 'product-1',
            name: 'Product A',
            price: 89.99,  // Changed
            status: 'draft',
            category: 'Electronics'
        },
        events: [
            {
                type: 'PriceUpdated',
                timestamp: new Date('2024-01-05T14:30:00'),
                data: {
                    oldPrice: 99.99,
                    newPrice: 89.99
                }
            }
        ]
    },
    {
        timestamp: new Date('2024-01-10T09:15:00'),
        readModel: {
            id: 'product-1',
            name: 'Product A',
            price: 89.99,
            status: 'active',  // Changed
            category: 'Electronics'
        },
        events: [
            {
                type: 'ProductPublished',
                timestamp: new Date('2024-01-10T09:15:00'),
                data: {
                    status: 'active'
                }
            }
        ]
    }
];

<TimeMachine
    versions={versions}
    currentVersionIndex={0}
    onVersionChange={handleVersionChange}
    scrollSensitivity={50}
/>
```

## Scroll Sensitivity

Control how much scrolling is needed to change versions:

```typescript
<TimeMachine
    scrollSensitivity={100}  // Requires more scrolling
    versions={versions}
/>

<TimeMachine
    scrollSensitivity={25}   // Changes versions more easily
    versions={versions}
/>
```

Higher values require more scroll distance before changing versions, providing finer control.

## Event Handling

```typescript
const handleVersionChange = (index: number) => {
    console.log('Switched to version:', index);
    console.log('Version data:', versions[index]);
    
    // Update related UI, fetch additional data, etc.
};

<TimeMachine
    versions={versions}
    onVersionChange={handleVersionChange}
/>
```

## Use Cases

TimeMachine is ideal for:

- Debugging event-sourced systems
- Auditing data changes
- Understanding data evolution
- Time-based data analysis
- Event replay and inspection
- Temporal queries visualization
- Compliance and audit trails
- Training and demonstrations
