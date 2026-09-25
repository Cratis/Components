---
title: TimeMachine views
description: What the read model view, the card flip, and the events view show, and how to render version content with Properties.
---

TimeMachine has two views, switched with the icon buttons at the top: the **read model view** (the default) and the **events view**.

## Read Model View

Displays each version as a card in a 3D stack, with the displayed version in front and later versions behind it.

### Features

- The front card shows the displayed version's `label` in its title bar and its `content` below
- Hovering or focusing a timeline entry brings that version to the front as a preview
- Clicking a card behind the front one selects that version
- The flip button in each card's title bar turns the card over to list the events behind that version
- The timeline and previous/next buttons navigate between versions (see [Navigation](navigation.md))

TimeMachine does not compare versions or highlight changed values. Each card shows exactly the `content` you supplied for that version.

### Property Display

`content` is any React node. The exported `Properties` component renders a plain key/value table and is the usual choice:

| Property | Value |
|----------|-------|
| Name     | Product A |
| Price    | 89.99 |
| Status   | active |

```tsx
import { Properties } from '@cratis/components/TimeMachine';

<Properties data={{ name: 'Product A', price: 89.99, status: 'active' }} align='left' />;
```

`Properties` takes `data: Record<string, unknown>`, an optional `className`, and `align` (`'left'` by default, or `'right'`). It is also used inside TimeMachine to show event payloads, and you can use it on its own, for example in a custom detail panel.

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

`Properties` does not expand nested objects or arrays: they show as `{...}` and `Array[n]`. To show nested data, flatten it into the `data` you pass, render several `Properties` tables, or render your own content. For browsing nested JSON with breadcrumbs, [`ObjectContentEditor`](../ObjectContentEditor/index.md) is an alternative `content` renderer.

### Card Navigation

- Click a card behind the front one to select that version
- Scroll inside the front card for long content; the wheel does not change versions while the pointer is over a card
- The front card's content area is a focusable region (accessible name "Read model snapshot"), so keyboard users can scroll it after tabbing to it
- Use the flip button (accessible name "Show related events", then "Show read model snapshot") to switch a card between its content and its events

### Related events on the card back

The back of a card lists the events of that version, each with its `type`, its `occurred` time (`toLocaleString()`), and its `content` in a `Properties` table. Only the displayed version's card has its events filled in.

## Events View

Shows all events from all versions in one vertical timeline, in the order of `versions` and then each version's `events` array. TimeMachine does not re-sort events by `sequenceNumber` or time.

### Event List

Each event is a card on alternating sides of a vertical line:

```text
        ●── ProductCreated      1/1/2024, 10:00:00
PriceUpdated   1/5/2024, 14:30:00 ──●
        ●── ProductPublished    1/10/2024, 09:15:00
```

### Event Details

Every event card always shows its full payload through `Properties`. There is nothing to expand:

```text
PriceUpdated                  1/5/2024, 2:30:00 PM
Old Price    99.99
New Price    89.99
```

### Selected version

Events that belong to the version selected in the read model view are marked with `data-selected` on the event and its marker, so your CSS can highlight them. Selection itself only changes in the read model view.

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

Toggle between views using the switcher at the top center:

```text
[Read Model] | [Events]
```

Both buttons are icon-only, with the accessible names "Read Model View" and "Events View" (override them through `labels`). The timeline and previous/next buttons appear only in the read model view.

### Read Model View

- Focus on the state at each version
- Navigate through time
- Flip a card to see the events behind it

### Events View

- Focus on what happened
- One list across all versions
- Full payload on every event

## Best Practices

### Read Model View

1. **Order versions oldest first**: the timeline and previous/next buttons follow the array order
2. **Give each version a meaningful `label`**: it is the card's title
3. **Render comparable content**: use the same `Properties` shape for every version so users can see what changed as they step through
4. **Flatten nested data**: `Properties` shows nested objects only as `{...}`

### Events View

1. **Pass events in order**: the view does not sort them
2. **Use `Date` objects** for `occurred`
3. **Keep payloads flat**: nested payload values show as `{...}` or `Array[n]`

### General

1. **Switch views**: Use both for complete understanding
2. **Localize accessible names** with `labels`
3. **Build `versions` once per change**: TimeMachine rebuilds its event list when the `versions` array identity changes
