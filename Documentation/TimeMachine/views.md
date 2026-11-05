---
title: TimeMachine views for snapshots and events
description: TimeMachine shows supplied snapshots as version cards and events as a timeline. Choose a view to inspect a past state or its related event payloads.
---

TimeMachine's read model view shows the snapshots your application supplies; its events view lists the events attached to those snapshots. Use the cards to inspect a past state and the event list to read the recorded details. Neither view retrieves history or calculates differences between versions.

## Read Model View

Start in the read model view when you want to see the data as it stood at a particular version. A read model is the data shaped for display in your application. Each version appears as a card in a 3D stack, with the displayed version in front and later versions behind it.

### Features

The front card shows the displayed version's `label` in its title bar and its `content` below. Hovering or focusing a timeline entry brings that version forward as a preview without changing the selection. Click a card behind the front one to select it, or use the timeline and previous/next buttons; [Navigation](navigation.md) explains those controls.

TimeMachine does not compare versions or highlight changed values. Each card shows exactly the `content` you supplied for that version. Use its flip button to inspect the events you associated with that snapshot.

### Property Display

Because `content` is a React node, a snapshot can use the presentation that suits its data. For a flat object, the exported `Properties` component renders a compact key/value table:

| Property | Value |
|----------|-------|
| Name     | Product A |
| Price    | 89.99 |
| Status   | active |

```tsx
import { Properties } from '@cratis/components/TimeMachine';

<Properties data={{ name: 'Product A', price: 89.99, status: 'active' }} align='left' />;
```

The supplied object produces one row per property, as shown in the table above. `Properties` takes `data: Record<string, unknown>`, an optional wrapper `className`, and `align` (`'left'` by default, or `'right'`) for the labels. TimeMachine also uses it to show event payloads. You can render it on its own in a custom detail panel.

`Properties` formats each row as follows:

| Value | Shown as |
| --- | --- |
| Key | Title case derived from the key: `newPrice` becomes "New Price" |
| `null` or `undefined` | `null` |
| `boolean` | `true` or `false` |
| `number` | The number |
| `Date` | `toLocaleString()` |
| Array | `Array[n]`, the item count |
| Other object | `{...}` |
| Anything else | `String(value)` |

### Nested Objects and Arrays

`Properties` does not expand nested objects or arrays: they show as `{...}` and `Array[n]`. To show nested data, flatten it into the `data` you pass, render several `Properties` tables, or render your own content. For browsing nested JSON with breadcrumbs, render [`ObjectContentEditor`](../ObjectContentEditor/index.md) in view mode as your `content`.

### Card Navigation

- Click a card behind the front one to select that version
- Scroll inside the front card for long content; the wheel does not change versions while the pointer is over a card
- The front card's content area is a focusable region (accessible name "Read model snapshot"), so keyboard users can scroll it after tabbing to it
- Use the flip button (accessible name "Show related events", then "Show read model snapshot") to switch a card between its content and its events

### Related events on the card back

The back of a card lists the events in that version's `events` array, each with its `type`, its `occurred` time (`toLocaleString()`), and its `content` in a `Properties` table. Only the displayed version's card has its events filled in. Your application supplies the association between a snapshot and its events.

## Events View

Switch to the events view to read the events across all supplied versions in one place. TimeMachine joins each version's `events` array in version order. It does not re-sort events by `sequenceNumber` or time, or remove duplicates, so prepare the arrays in the order you want readers to see.

### Event List

Each event is a card on alternating sides of a vertical line:

```text
        ●── ProductCreated      1/1/2024, 10:00:00
PriceUpdated   1/5/2024, 14:30:00 ──●
        ●── ProductPublished    1/10/2024, 09:15:00
```

### Event Details

Each event card displays its payload through `Properties`, with nested values summarized as `{...}` or `Array[n]`. For a flat price-change event, the table looks like this:

```text
PriceUpdated                  1/5/2024, 2:30:00 PM
Old Price    99.99
New Price    89.99
```

The old and new prices are fields in the supplied payload. TimeMachine does not calculate them by comparing snapshots or neighboring events.

### Selected version

An event is marked with `data-selected` on the event and its marker when its `sequenceNumber` matches one in the selected version's event list. Your CSS can use that attribute to highlight related events. Switching views keeps the selection; selection itself only changes in the read model view.

### Scrolling

The event list is a focusable scroll region (accessible name "Event timeline"). When there is more content above or below, scroll-to-top and scroll-to-bottom buttons appear. They scroll smoothly unless the user prefers reduced motion.

The events view has no search, filtering, grouping, or correlation display. Filter `versions` or their `events` before passing them in if users need a narrower list.

### Using EventsView on its own

`EventsView` is exported for use outside TimeMachine. It takes `events: Event[]`, an optional `className`, an optional complete `labels` object (for example `{ ...defaultTimeMachineLabels, eventTimelineRegion: 'Hendelser' }`), and `pt` part attributes for `timeline`, `event`, `separator`, `marker`, `connector`, and `content`:

```tsx
import { EventsView } from '@cratis/components/TimeMachine';

<EventsView events={events} className='product-events' />;
```

Outside TimeMachine, no event is marked as selected.

## View Switcher

TimeMachine starts in the read model view. Toggle between views using the switcher at the top center:

```text
[Read Model] | [Events]
```

Both buttons are icon-only, with the accessible names "Read Model View" and "Events View" (override them through `labels`). The timeline and previous/next buttons appear only in the read model view.

### Read Model View

Use the version cards to inspect one snapshot at a time, then flip the front card to read its related events. This view does not provide a side-by-side comparison or highlight changed values.

### Events View

Use the event list to investigate recorded details across versions. The list contains only the events your application supplies, so its completeness and order depend on how you prepare that history.

## Best Practices

### Read Model View

Order versions oldest first because the timeline and previous/next buttons follow the array order. Give each version a meaningful `label` for its card title. Keeping the same fields in each snapshot makes it easier to review states as you step through them. Flatten nested data when readers need to see its values in `Properties`; nested objects otherwise appear as `{...}`.

### Events View

Pass events in the order you want them displayed, and use `Date` objects for `occurred`. Keep the fields readers need to inspect at the top level of the payload, since nested values show as `{...}` or `Array[n]`.

### General

Localize accessible names through `labels` for the people using your application. Keep the `versions` array reference stable until its data changes: TimeMachine rebuilds its combined event list when that reference changes. For the required fields, date types, and label overrides, continue to [Configuration](configuration.md).
