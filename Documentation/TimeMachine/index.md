# TimeMachine

The `TimeMachine` component provides an interactive timeline visualization for exploring the evolution of data over time through events and state changes.

TimeMachine belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency and no separate peer to install.

## Purpose

TimeMachine allows users to navigate through different versions of data, viewing the read model state and associated events at each point in time.

## Transport neutrality

TimeMachine has no built-in fetch, HTTP client, or WebSocket — its entire data contract is the `versions: Version[]` prop and the optional `onVersionChange` callback. The component owns scrubbing, gesture, and selection UI state only; it never requests data on its own.

This means TimeMachine is transport-neutral by construction: a host application can populate `versions` from an Arc query, from a Chronicle-backed read model plus its event history (a natural fit, since `Version.events` already models a per-version event list), from a plain REST endpoint, or from static/local state. TimeMachine has no Chronicle awareness or coupling — an event-sourced application maps its own event/read-model history into the `Version` shape before rendering; TimeMachine does not know, or need to know, where that data came from.

## Key Features

- Timeline-based navigation
- Read model state visualization
- Event history view
- Interactive version selection
- Trackpad gesture support
- Smooth transitions between versions
- Property comparison between versions
- Hover preview functionality

## Quick Start

```typescript
import { TimeMachine } from '@cratis/components/TimeMachine';

interface Version {
    id: string;
    timestamp: Date;
    label: string;
    content: React.ReactNode;
    events?: Array<{
        sequenceNumber: number;
        type: string;
        occurred: Date;
        content: Record<string, unknown>;
    }>;
}

function MyTimeMachine() {
    const versions: Version[] = [
        {
            id: 'v1',
            timestamp: new Date('2024-01-01'),
            label: 'Initial',
            content: <div>Name: Initial — Status: draft</div>,
            events: [
                { sequenceNumber: 0, type: 'Created', occurred: new Date('2024-01-01'), content: {} }
            ]
        }
    ];

    return (
        <TimeMachine
            versions={versions}
            currentVersionIndex={0}
            onVersionChange={(index) => console.log('Version:', index)}
        />
    );
}
```

## See Also

- [Configuration](configuration.md) - Props and version structure
- [Navigation](navigation.md) - Timeline and gesture controls
- [Views](views.md) - Read model and events views
