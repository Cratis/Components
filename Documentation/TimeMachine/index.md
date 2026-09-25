---
title: TimeMachine
description: Explore versions, events, and read-model changes along an interactive timeline.
---

The `TimeMachine` component provides an interactive timeline visualization for exploring the evolution of data over time through events and state changes.

TimeMachine belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency and no separate peer to install.

## Purpose

TimeMachine allows users to navigate through different versions of data, viewing the read model state and associated events at each point in time.

## Transport neutrality

TimeMachine has no built-in fetch, HTTP client, or WebSocket — its entire data contract is the `versions: Version[]` prop and the optional `onVersionChange` callback. The component owns scrubbing, gesture, and selection UI state only; it never requests data on its own.

This means TimeMachine is transport-neutral by construction: a host application can populate `versions` from an Arc query, from a Chronicle-backed read model plus its event history (a natural fit, since `Version.events` already models a per-version event list), from a plain REST endpoint, or from static/local state. TimeMachine has no Chronicle awareness or coupling — an event-sourced application maps its own event/read-model history into the `Version` shape before rendering; TimeMachine does not know, or need to know, where that data came from.

## Key Features

- A timeline of versions, with a magnifying effect around the hovered entry
- A stack of version cards showing your rendered state for each version
- A card flip that lists the events behind a version
- An events view listing every event across all versions
- Selection through the timeline, previous/next buttons, clicking a card, or wheel and trackpad scrolling
- Hover or focus preview of a version without selecting it
- Localizable accessible names through `labels`

## Quick Start

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

TimeMachine opens on the latest version, with its card in front and a vertical timeline along the right edge. Click the other timeline entry, press the previous button at the bottom, or scroll over the background to move between versions. The list icon in the switcher at the top opens the events view.

`content` is whatever you render for that version. The exported `Properties` component renders a plain key/value table and is the usual choice; see [Views](views.md).

## Size and appearance

The `.time-machine` root is `100vh` tall and `100%` wide, with its own dark theme set through `--tm-*` custom properties on that root. To fit it into part of a page, give it a height in your own CSS (for example `.my-history .time-machine { height: 480px; }` with the component inside `.my-history`), and override the `--tm-*` properties there to change its colors. Import `@cratis/components/TimeMachine/styles` or the aggregate `@cratis/components/styles` for its CSS.

## Empty, loading, and error states

TimeMachine has none of its own. It renders whatever `versions` contains and never fetches. Show your own loading and error UI while you build `versions`, and render a message instead of TimeMachine until there is at least one version.

## See Also

- [Configuration](configuration.md) - Props and version structure
- [Navigation](navigation.md) - Timeline and gesture controls
- [Views](views.md) - Read model and events views
