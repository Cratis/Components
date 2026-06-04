# TimeMachine

The `TimeMachine` component provides an interactive timeline visualization for exploring the evolution of data over time through events and state changes.

## Purpose

TimeMachine allows users to navigate through different versions of data, viewing the read model state and associated events at each point in time.

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
