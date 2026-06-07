# TimeMachine - Configuration

## Props

### Required Props

- `versions`: Array of version objects containing id, timestamp, label, content, and events

### Optional Props

- `currentVersionIndex`: Initial version index (default: 0)
- `onVersionChange`: Callback when version changes
- `scrollSensitivity`: Scroll distance required to change versions (default: 50)

## Version Structure

Each version in the `versions` array should have:

```typescript
{
    id: string;                // Unique identifier for this version
    timestamp: Date;           // When this version was created
    label: string;             // Display label for the version
    content: React.ReactNode;  // Rendered content shown for this version
    events?: Array<{           // Events that led to this version
        sequenceNumber: number; // Sequence number of the event
        type: string;          // Event type name
        occurred: Date;        // When the event occurred
        content: Record<string, unknown>; // Event payload
    }>;
}
```

## Complete Example

```typescript
const versions = [
    {
        id: 'v1',
        timestamp: new Date('2024-01-01T10:00:00'),
        label: 'Created',
        content: <div>Product A — $99.99 — draft</div>,
        events: [
            {
                sequenceNumber: 0,
                type: 'ProductCreated',
                occurred: new Date('2024-01-01T10:00:00'),
                content: {
                    name: 'Product A',
                    category: 'Electronics'
                }
            }
        ]
    },
    {
        id: 'v2',
        timestamp: new Date('2024-01-05T14:30:00'),
        label: 'Price updated',
        content: <div>Product A — $89.99 — draft</div>,
        events: [
            {
                sequenceNumber: 1,
                type: 'PriceUpdated',
                occurred: new Date('2024-01-05T14:30:00'),
                content: {
                    oldPrice: 99.99,
                    newPrice: 89.99
                }
            }
        ]
    },
    {
        id: 'v3',
        timestamp: new Date('2024-01-10T09:15:00'),
        label: 'Published',
        content: <div>Product A — $89.99 — active</div>,
        events: [
            {
                sequenceNumber: 2,
                type: 'ProductPublished',
                occurred: new Date('2024-01-10T09:15:00'),
                content: {
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
