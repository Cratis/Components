# Messaging

The canvas shapes can announce what happens on them over the `@cratis/arc.react` messenger — region membership changes, committed note edits, sent chat messages. This is strictly opt-in and additive: every shape's existing callback contract is unchanged, and a board that ignores all of this behaves exactly as before.

## Silently inert without Arc

Nothing here requires Arc to be wired up. Without an `ArcContext` above the `Canvas` — a Storybook story, a test, a host that simply does not use Arc — every shape renders and behaves exactly as it always has: nothing throws, nothing is required, and no message reaches anyone. Publishing resolves the nearest messenger the same way `useMessenger()` does (a `MessengerScope` between the `Arc` root and the canvas is honored), and when a host mounts an `ArcContext.Provider` whose configuration carries no messenger, the shapes stay silent rather than failing.

To receive the messages, subscribe on the same messenger anywhere under the same context:

```tsx
import { useOnMessage } from '@cratis/arc.react/messaging';
import { ItemAddedToRegion, ItemRemovedFromRegion } from '@cratis/components/Canvas';

function Board() {
    useOnMessage(ItemAddedToRegion, (message) => {
        // message.regionId, message.itemId — persist membership, issue a command, whatever the board means by it
    });
    useOnMessage(ItemRemovedFromRegion, (message) => {
        /* ... */
    });
    // ... render the Canvas
}
```

## Identity: the `id` props

Messages are keyed by ids the host already owns, opted in per shape:

- **`CanvasItem` accepts an optional `id`.** When set, the item registers in the Canvas item registry under that id instead of an internal generated one — which is what makes it addressable in region-membership reports. Items without an `id` behave exactly as before and are anonymous to containment detection.
- **The `CanvasItem` wrapping a `Region` must carry `id={region.id}`.** That convention is how the region recognizes its own registry entry and excludes itself from its own containment reports.
- **`Chat` accepts an optional `id`.** Only a chat with an id publishes `ChatMessageAdded`.
- **`Note` needs no new prop** — `NoteTextChanged` carries the `note.id` it already has.

## Message catalog

| Message                 | Fields               | Published when                                                                                                                                                                                                                                                                             |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ItemAddedToRegion`     | `regionId`, `itemId` | A sibling `CanvasItem` carrying an `id` newly has its center point within a `Region`'s bounds — whether the item moved into the region, or the region was moved/resized over it. Also published on mount for every item already contained, so a subscriber never misses the initial state. |
| `ItemRemovedFromRegion` | `regionId`, `itemId` | Such an item's center point leaves the region's bounds — including by the item unmounting.                                                                                                                                                                                                 |
| `NoteTextChanged`       | `noteId`, `text`     | A `Note` edit is committed (the editor loses focus) — the same moment `onTextChange` fires, never per keystroke. Carries the full committed text.                                                                                                                                          |
| `ChatMessageAdded`      | `chatId`, `text`     | A `Chat` given an `id` sends a message from its composer — the same moment `onSend` fires.                                                                                                                                                                                                 |

All of them are plain classes with `constructor(readonly ...)` fields, importable from `@cratis/components/Canvas`.

Containment is by center point, inclusive of the region's edges, and the pure function behind it — `itemsWithinRegion(regionBounds, items, excludeId?)` — is exported for hosts that want the same math outside the messenger flow (hit-testing a drop, say). Overlapping regions may each claim the same item; resolving exclusivity is deliberately the host's job, as is everything else membership implies — the region never moves members, persists nothing, and knows nothing about item types (see [Regions](regions.md)).

## Defining your own messages for your own shapes

The catalog above is the pattern, not a closed set. A host with its own shapes on the board publishes its own analogous messages the same way: a plain class whose constructor fields carry the ids and payload, published on the messenger at the moment the interaction commits.

```tsx
// The message: a plain class, ids and payload as readonly constructor fields.
export class CardFlipped {
    constructor(
        readonly cardId: string,
        readonly faceUp: boolean,
    ) {}
}

// Inside the shape, at the commit point of the interaction:
import { useMessenger } from '@cratis/arc.react/messaging';

const messenger = useMessenger();
const handleFlip = () => {
    onFlip(card.id); // the callback contract stays primary
    messenger.publish(new CardFlipped(card.id, !card.faceUp));
};
```

Keep the shape's callback as the primary contract and treat the message as an additive announcement, publish once per committed interaction rather than per intermediate frame, and key by the id the host already owns — then your shapes compose with subscribers exactly like the built-in ones do.
