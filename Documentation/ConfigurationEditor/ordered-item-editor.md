---
title: Ordered item editor
description: Edit an ordered collection of labeled items with an icon and a destination, with fixed items and per-operation restrictions.
---

`OrderedItemEditor` edits an ordered collection, such as the entries of a navigation component. Each item has a label, an optional icon and an optional destination; items can be added, removed and reordered.

```tsx
import { useState } from 'react';
import { OrderedItemEditor } from '@cratis/components/ConfigurationEditor';
import type { OrderedItem, OrderedItemCapabilities } from '@cratis/components/ConfigurationEditor';

const home: OrderedItem = { id: 'home', label: 'Home', destination: 'overview' };

const capabilities: OrderedItemCapabilities = {
    add: true,
    remove: true,
    reorder: true,
    fields: { label: 'editable', icon: 'editable', destination: 'editable' },
};

export function NavigationConfiguration() {
    const [items, setItems] = useState<OrderedItem[]>([
        { id: 'page-a', label: 'Page A' },
        { id: 'page-b', label: 'Page B' },
    ]);

    return (
        <OrderedItemEditor
            aria-label='Navigation'
            items={items}
            fixedItems={[home]}
            capabilities={capabilities}
            destinations={[{ id: 'overview', label: 'Overview' }]}
            createItem={() => ({ id: crypto.randomUUID(), label: 'New page' })}
            onChange={(proposal) => setItems([...proposal.items])}
        />
    );
}
```

## Items

An item has a stable `id` that the host assigns and that survives rename and reorder. The editor never derives identity from the label or the position. `OrderedItem` can be extended: properties the editor does not know are carried through every proposal unchanged.

`fixedItems` are inherited items. They are listed separately under their own heading, marked **Locked**, have no controls and never appear in a proposal.

## Capabilities

`capabilities` is the host's answer to "what may be changed":

| Property | Meaning |
|---|---|
| `add`, `remove`, `reorder` | Whether the operation is offered. |
| `fields` | Access per field: `'editable'`, `'readonly'` (shown as text) or `'hidden'`. A field you leave out is hidden. Fields are narrowed independently. |
| `maxItems` | The most configurable items. Adding becomes unavailable once it is reached. |
| `reasons` | Why an operation or field is restricted. Printed as text next to the restriction. |

Allowing the add operation does not allow editing or removing fixed items, and does not allow changing a field. Each is its own capability.

## Proposals

`onChange` receives a validated proposal. The union is discriminated by `kind`:

| `kind` | Extra properties |
|---|---|
| `'add'` | `item`, `index` |
| `'remove'` | `item`, `index` |
| `'move'` | `item`, `fromIndex`, `toIndex` |
| `'update'` | `item` (as it would be), `previous`, `field` |

Every proposal also carries `items`, the collection as it would be, so accepting one is a single assignment as in the example. To cancel, ignore it: the editor keeps showing the `items` it was given, and a text entry that the host did not accept is restored when the person leaves the field or presses Escape.

Proposals are only emitted for entries that pass validation. A blank label is never proposed. Add your own rules with `validate(item, items)`, which runs on the item as it would be and returns messages by field (`label`, `icon`, `destination`) or for the item as a whole (`item`). Feedback that arrives from elsewhere, such as a server check, goes in `validation`, keyed by item id.

## Adding items

The host creates the item, so it also creates the stable id. Supply `createItem`; without it, adding is unavailable. After an add, focus moves to the new item's label.

## Reordering

There are three ways, so no one depends on a pointer:

- **Buttons.** Every item has labeled move-up and move-down buttons ("Move Page A down"). At the ends the button is marked `aria-disabled` rather than `disabled`, so it keeps focus.
- **Keyboard.** The item's handle is a button; Arrow Up and Arrow Down move the item and keep focus on the handle.
- **Pointer.** Drag the handle onto another item. A line shows whether the item lands before or after the target. This uses native HTML5 drag-and-drop, which does not work on every touch browser; the buttons are the equivalent there.

After any move, focus returns to the control that was used, and a status region announces the new position ("Page A moved to position 2 of 3."). A move the host does not apply changes nothing and does not pull focus later.

## Icons and destinations

**Destination.** Supply `destinations` as `{ id, label, group? }`. The editor shows a select, grouped by `group`, and stores the destination `id`. A stored id the host no longer lists is flagged in text. The editor does not route.

**Icon.** Icons are qualified references, `{ library, key, variant? }`. Only those three fields are identity; names, classes and markup are not. Choosing an icon needs the host's catalog, so the editor takes a `renderIconField` function. It receives the item, the current `value`, `onChange(icon)`, `readOnly`, an accessible name that includes the item, and the validation state, and renders the host's icon chooser. The editor turns the pick into a validated proposal, and ignores it when the field is not editable. Without `renderIconField` the icon is shown as text only.

`isIconAvailable(icon)` lets the host say that its catalog can no longer supply an icon; the field is flagged with text and `data-unavailable`.

## Localization and styling

`labels` replaces any of the editor's strings; the functions receive the item's label so each control names its item. `pt` passes attributes to the stable parts: `root`, `section`, `sectionTitle`, `list`, `item`, `handle`, `moveUp`, `moveDown`, `label`, `icon`, `destination`, `remove`, `add`, `message`, `state`, `empty` and `status`. An item carries `data-locked`, `data-dragging` and `data-drop-position`. Long labels wrap, and in a narrow panel the controls of an item stack.
