---
title: Canvas messaging — respond to shape interactions
description: Subscribe to local Canvas region, note, and chat messages through the Arc messenger, then connect those interactions to your application logic.
---

Canvas shapes in Cratis Components publish local interaction messages through the `@cratis/arc.react` messenger. Subscribe when another component needs to respond to a region membership change, a committed note edit, or a chat send. Callbacks remain the primary contract; these announcements do not save data or synchronize a board between users.

<a id="silently-inert-without-arc"></a>

## Choose the messenger scope

Publishers and subscribers must resolve the same messenger to communicate directly. Shapes use `useMessenger()` to find the nearest `MessengerScope`, falling back to the Arc root messenger. Put a board and its listeners under the same scope when they should share interaction messages.

Shapes also work without an Arc provider. In that case, Arc supplies a default in-memory messenger, so listeners resolving that default can still receive messages. If your application supplies an `ArcContext.Provider` with no `messenger`, built-in shapes skip publishing instead of throwing. A missing provider is therefore different from an explicitly missing messenger.

Subscribe with `useOnMessage` in a component under the chosen scope:

```tsx
import { useOnMessage } from '@cratis/arc.react/messaging';
import { ItemAddedToRegion, ItemRemovedFromRegion } from '@cratis/components/Canvas';

export function RegionMembershipListener() {
    useOnMessage(ItemAddedToRegion, (message) => {
        // Persist membership, issue a command, or whatever the board means by it.
        console.log('added', message.regionId, message.itemId);
    });
    useOnMessage(ItemRemovedFromRegion, (message) => {
        console.log('removed', message.regionId, message.itemId);
    });
    return null;
}
```

## Identity: the `id` props

Use ids from your application's data so a listener can connect an interaction to the right item. Give each reportable `CanvasItem` an `id`; without one, it still appears in the minimap and measured bounds but is excluded from region membership reports.

The `CanvasItem` wrapping a `Region` must use `id={region.id}`. The region uses that matching id to exclude its own registry entry. `NoteTextChanged` carries the existing `note.id`, while `ChatMessageAdded` requires an explicit `id` on Chat.

With the listener above mounted, move an identified item into a region and then out again. The console should report its region and item ids. Connect that listener to application logic only after deciding whether it should handle the same interaction as a callback; using both to save a change can duplicate the work.

## Message catalog

| Message                 | Fields               | Published when                                                                                                                                                                                                                                                                             |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ItemAddedToRegion`     | `regionId`, `itemId` | An identified sibling item's center enters a region's bounds, or the region moves/resizes over it. Also published as initially contained items register; subscribers mounted later do not receive past messages. |
| `ItemRemovedFromRegion` | `regionId`, `itemId` | Such an item's center point leaves the region's bounds — including by the item unmounting.                                                                                                                                                                                                 |
| `NoteTextChanged`       | `noteId`, `text`     | A `Note` edit is committed when its editor loses focus, after `onTextChange` is called. Carries the full committed text, never a per-keystroke update.                                                                                                                                          |
| `ChatMessageAdded`      | `chatId`, `text`     | A `Chat` with an `id` sends text from its composer, after `onSend` is called. This does not confirm that the application saved the message.                                                                                                                                                                                                 |

All of them are plain classes with `constructor(readonly ...)` fields, importable from `@cratis/components/Canvas`.

Containment tests the item's center point and includes all four region edges. Overlapping regions can each report the same item. Your application decides whether membership must be exclusive and what it means; a region neither moves its members nor persists membership. See [Regions](regions.md) for positioning and resizing.

For containment checks outside the messenger flow, call the exported `itemsWithinRegion(regionBounds, items, excludeId?)` function. It accepts entries with `{x, y, width, height}` bounds. The optional `anonymous: true` flag excludes an entry from membership results; Canvas sets it for items without an explicit id. When you supply your own bounds map, omit the flag for entries you want included.

## Defining your own messages for your own shapes

For a custom shape, define a message class carrying its application id and committed value. Publish it where the interaction commits, alongside the shape's callback.

This excerpt shows only the publishing code; `card` and `onFlip` stand for your shape's props. It assumes `useMessenger()` resolves a messenger. Unlike the built-in shapes, the direct `messenger.publish` call does not guard against an `ArcContext.Provider` whose configuration omits `messenger`. Add that guard if your application allows that configuration.

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

Subscribe to `CardFlipped` with `useOnMessage`, just as with the built-in message classes. Keep publication at the commit point so listeners receive the chosen value rather than intermediate animation frames. Your application owns any command, persistence, or collaboration flow that follows.

For the callback side of these interactions, continue to [Notes](notes.md), [Regions](regions.md), or [Canvas chat](chat-bubble.md).
