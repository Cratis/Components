---
title: TimeMachine version and event exploration
description: TimeMachine displays version snapshots and related events supplied by your React app. Load history yourself; the component does not compare values.
---

`TimeMachine` is a React component for browsing version snapshots and their related events on an interactive timeline. Use it to let readers inspect a past state and the events you associate with it. Your application supplies the history; TimeMachine does not retrieve it or compare values between versions.

TimeMachine belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles). It renders with React and the DOM and does not require Pixi.

## Purpose

When someone needs to investigate a product's price history, the current price alone is not enough. TimeMachine lets them step through snapshots of the data shown by your application, called a read model, and flip a snapshot's card to inspect its related events. The events view brings the supplied events together in one list.

## Transport neutrality

Load or construct the history in your application, then map each snapshot to a `Version` with its rendered `content` and optional `events`. Pass those entries through `versions: Version[]`. TimeMachine handles timeline navigation and selection; the optional `onVersionChange` callback reports the selected index to your application.

The source of that history is your choice. TimeMachine has no built-in fetch, HTTP client, or WebSocket, and it does not reconstruct earlier states from events. Supply both the snapshots you want readers to inspect and the events you want to show beside them. [Configuration](configuration.md) describes the `Version` and `Event` shapes.

## Key Features

- Browse snapshots through the timeline, previous/next buttons, stacked cards, or wheel and trackpad scrolling
- Preview a snapshot by hovering or focusing its timeline entry without selecting it; entries magnify around the pointer or focus
- Flip a card to inspect the events supplied for that version
- Switch to the events view to read the events across all supplied versions
- Localize accessible names through `labels`

## Quick Start

This example supplies two product snapshots and their events from local data. Import `@cratis/components/TimeMachine/styles` or the aggregate `@cratis/components/styles` for its CSS.

```tsx
import { useState } from 'react';
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
                content: { name: 'Product A', price: 99.99 },
            },
        ],
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
                content: { oldPrice: 99.99, newPrice: 89.99 },
            },
        ],
    },
];

export function ProductHistory() {
    const [versionIndex, setVersionIndex] = useState(versions.length - 1);

    return (
        <TimeMachine
            versions={versions}
            currentVersionIndex={versionIndex}
            onVersionChange={setVersionIndex}
        />
    );
}
```

The example sets the initial index to the last entry, so the price-updated snapshot opens in front. Click the earlier timeline entry, press the previous button at the bottom, or scroll over the background to see the original price. Flip the front card to inspect its event, or use the list icon at the top to open the events view. The `oldPrice` and `newPrice` fields come from the supplied event payload; TimeMachine does not calculate them.

Each version's `content` is rendered as supplied. Here, `Properties` turns the snapshot data into a key/value table. Use [Views](views.md) to choose how to present your own snapshots and event payloads.

## Size and appearance

The `.time-machine` root is `100vh` tall and `100%` wide, with its own dark theme set through `--tm-*` custom properties on that root. To fit it into part of a page, give it a height in your own CSS (for example `.my-history .time-machine { height: 480px; }` with the component inside `.my-history`), and override the `--tm-*` properties there to change its colors. Import `@cratis/components/TimeMachine/styles` or the aggregate `@cratis/components/styles` for its CSS.

## Empty, loading, and error states

Handle loading and errors in your application while you build `versions`. TimeMachine has no loading, error, or empty-state UI and does not fetch data. Render a message instead of TimeMachine until there is at least one version.

## See Also

- [Configuration](configuration.md) - Props and version structure
- [Navigation](navigation.md) - Timeline and gesture controls
- [Views](views.md) - Read model and events views
