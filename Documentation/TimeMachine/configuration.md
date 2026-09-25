---
title: TimeMachine configuration
description: Props, the Version and Event shapes, scroll sensitivity, and localization for TimeMachine.
---

## Props

### Required Props

- `versions`: Array of `Version` objects, in the order they appear on the timeline (the first entry is the oldest)

### Optional Props

- `currentVersionIndex`: Zero-based version selected at mount (default: `0`). Later changes to this prop do not move the selection; see [Navigation](navigation.md#initial-version-and-change-observation).
- `onVersionChange`: `(index: number) => void`, called whenever the user selects a different version through the timeline, a version card, the previous/next buttons, or wheel scrolling
- `scrollSensitivity`: Accumulated wheel distance, in wheel-delta units (pixels for most trackpads), needed to move one version (default: `50`)
- `labels`: `Partial<TimeMachineLabels>` overriding the English accessible names; see [Localization](#localization)

## Version Structure

`Version` and `Event` are exported from `@cratis/components/TimeMachine`:

```typescript
interface Version {
    id: string; // Unique identifier; also the React key for the card and timeline entry
    timestamp: Date; // Shown as date and time on the timeline entry
    label: string; // Shown in the title bar of the version card
    content: React.ReactNode; // Rendered as-is on the front of the version card
    events?: Event[]; // Events that produced this version
}

interface Event {
    sequenceNumber: number; // Marks the event as belonging to the selected version in the events view
    type: string; // Event type name, shown as the event heading
    occurred: Date; // Shown with toLocaleString(); must be a Date, not a string
    content: Record<string, unknown>; // Payload, rendered with the Properties table
}
```

Convert ISO strings from your API to `Date` objects before rendering. TimeMachine calls `Date` methods on both `timestamp` and `occurred`.

## Complete Example

`handleVersionChange` is defined under [Event handling](#event-handling).

```tsx
import { Properties, TimeMachine, type Version } from '@cratis/components/TimeMachine';

const versions: Version[] = [
    {
        id: 'v1',
        timestamp: new Date('2024-01-01T10:00:00'),
        label: 'Created',
        content: <Properties data={{ name: 'Product A', price: 99.99, status: 'draft' }} />,
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
        content: <Properties data={{ name: 'Product A', price: 89.99, status: 'draft' }} />,
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
        content: <Properties data={{ name: 'Product A', price: 89.99, status: 'active' }} />,
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
/>;
```

## Scroll Sensitivity

Control how much scrolling is needed to change versions:

```tsx
<TimeMachine
    versions={versions}
    scrollSensitivity={100} // Requires more scrolling per version
/>
```

Higher values require more scroll distance before changing versions, providing finer control; lower values such as `25` change versions more easily. Scrolling moves at most one version each time the threshold is reached. Wheel navigation applies only in the read model view, and not while the pointer is over a version card, so users can still scroll long card content.

## Event Handling

```tsx
const handleVersionChange = (index: number) => {
    console.log('Switched to version:', versions[index].label);
    // Update related UI, fetch additional data, etc.
};

<TimeMachine
    versions={versions}
    onVersionChange={handleVersionChange}
/>
```

`onVersionChange` fires only for user navigation, immediately after the selection changes. It does not fire at mount, and hovering or focusing a timeline entry (a preview) does not fire it.

## Localization

`labels` overrides the accessible names and titles TimeMachine renders. Every field is optional; omitted fields fall back to `defaultTimeMachineLabels`:

| Key | Default |
| --- | --- |
| `readModelView` | Read Model View |
| `eventsView` | Events View |
| `previousVersion` | Previous version |
| `nextVersion` | Next version |
| `showRelatedEvents` | Show related events |
| `showReadModelSnapshot` | Show read model snapshot |
| `scrollToTop` | Scroll to top |
| `scrollToBottom` | Scroll to bottom |
| `eventTimelineRegion` | Event timeline |
| `readModelSnapshotRegion` | Read model snapshot |
| `relatedEventsRegion` | Related Events |

```tsx
<TimeMachine
    versions={versions}
    labels={{ previousVersion: 'Forrige versjon', nextVersion: 'Neste versjon' }}
/>
```

Timeline dates and times are formatted with the locale from the nearest React Aria `I18nProvider`, or the browser default. Event timestamps use `toLocaleString()` without a locale argument, and property names in `Properties` are derived from the keys (`newPrice` becomes "New Price"); neither is covered by `labels`.

## Use Cases

TimeMachine is ideal for:

- Debugging event-sourced systems
- Auditing data changes
- Understanding data evolution
- Time-based data analysis
- Inspecting the events behind each version
- Temporal queries visualization
- Compliance and audit trails
- Training and demonstrations
