# TimeMachine - Views

## Read Model View

Displays the state of the read model at each version as interactive cards.

### Features

- Property-by-property display
- Change highlighting
- Nested object navigation
- Timeline integration
- Hover preview

### Property Display

Properties are shown in a table format:

| Property | Value |
|----------|-------|
| name     | Product A |
| price    | $89.99 |
| status   | active |
| category | Electronics |

### Change Highlighting

When hovering over a timeline point or transitioning between versions, changed properties are highlighted:

- **Green highlight**: Value increased/added
- **Red highlight**: Value decreased/removed
- **Yellow highlight**: Value changed

### Nested Objects

Click object or array properties to drill down:

```
Properties:
  name: "Product A"
  price: 89.99
  metadata: [Object] →    ← Click to expand
```

Navigating into metadata:

```
metadata:
  created: "2024-01-01"
  updated: "2024-01-10"
  version: 3
```

Use breadcrumb navigation to return to parent level.

### Array Display

Arrays show item count and are expandable:

```
tags: [Array of 3] →
```

Expanded view shows array items:

```
tags:
  [0]: "electronics"
  [1]: "sale"
  [2]: "featured"
```

### Card Navigation

- Click nested objects/arrays to navigate deeper
- Use breadcrumbs to navigate back up
- Scroll within cards for long content
- Cards prevent version changes while scrolling

## Events View

Shows all events across all versions in chronological order.

### Event List

```
Event Type          Timestamp
─────────────────  ──────────────
ProductCreated     2024-01-01 10:00
PriceUpdated       2024-01-05 14:30
ProductPublished   2024-01-10 09:15
StockUpdated       2024-01-12 16:45
```

### Event Details

Click any event to expand its full payload:

```
PriceUpdated - 2024-01-05 14:30:00

Event Data:
{
  "oldPrice": 99.99,
  "newPrice": 89.99,
  "reason": "promotional discount"
}
```

### Filtering Events

Search or filter events by:

- Event type
- Date range
- Property changes
- Event payload content

### Event Timeline

Events are displayed chronologically, making it easy to:

- See the sequence of changes
- Identify patterns
- Find specific events
- Understand causality

### Event Correlation

Related events are grouped or linked:

```
ProductCreated
  └─ PriceSet
  └─ CategoryAssigned
  └─ InitialStockSet
```

## View Switcher

Toggle between views using the switcher:

```
[📦 Read Model] | [📋 Events]
```

### Read Model View

- Focus on current state
- Navigate through time
- See property changes
- Interactive exploration

### Events View

- Focus on what happened
- Chronological list
- Event details
- Audit trail

## Comparison View

(If implemented) Compare two versions side-by-side:

```
Version 1 (2024-01-01)  |  Version 3 (2024-01-10)
─────────────────────── | ───────────────────────
name: Product A         |  name: Product A
price: 99.99           |  price: 89.99 ⚠️
status: draft          |  status: active ⚠️
```

## Best Practices

### Read Model View

1. **Start at beginning**: View initial state first
2. **Progress forward**: Watch evolution chronologically
3. **Focus on changes**: Pay attention to highlighted properties
4. **Explore nested data**: Drill into complex objects
5. **Use hover preview**: Quickly check nearby versions

### Events View

1. **Filter strategically**: Narrow down to relevant events
2. **Expand details**: Review event payloads for context
3. **Follow sequences**: Track related events
4. **Export if needed**: Save event history for analysis

### General

1. **Switch views**: Use both for complete understanding
2. **Take notes**: Document important changes
3. **Screenshot states**: Capture evidence for audits
4. **Test scenarios**: Replay events to validate logic
