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

**Icon.** The icon field is the Components [icon picker](../IconPicker/index.md); there is no separate icon grid. Supply the icons you offer as `iconCatalog`, an `IconPickerCatalog` of `libraries` and `icons`. Icons are qualified references, `{ library, key, variant? }`; only those three fields are identity, so two libraries that both ship a `home` icon stay distinct and names, classes and markup are never stored.

```tsx
<OrderedItemEditor
    aria-label='Navigation'
    items={items}
    capabilities={capabilities}
    iconCatalog={iconCatalog}
    allowedIcons={[{ library: 'example-glyphs', key: 'home' }]}
    onChange={(proposal) => setItems([...proposal.items])}
/>
```

- `allowedIcons` restricts what can be picked. Other icons are still listed, marked unavailable with a dashed border and text, and the editor never proposes one, even from a custom chooser.
- The field follows the item's `icon` access in `capabilities`. A `'readonly'` icon, and every icon of a locked fixed item, is shown in a trigger that stays focusable but does not open; a `'hidden'` icon is not rendered. A pick becomes a validated `update` proposal for the `icon` field, and the picker closes and returns focus to its trigger.
- An icon the catalog no longer contains is shown by its identity with a warning, never as another library's icon of the same name. `isIconAvailable(icon)` lets the host flag an icon for its own reasons, for example one that is retired but still in the catalog.
- Pass `iconPickerLabels` to localize the picker. The picker's own message appears under the trigger, so the editor adds no second one.
- Import `@cratis/components/ConfigurationEditor/styles`; it includes the icon picker's rules.

**Own chooser.** `renderIconField` replaces the picker with the host's own chooser and takes precedence over `iconCatalog`. It receives the item, the current `value`, `onChange(icon)`, `readOnly`, an accessible name that includes the item, and the validation state. The editor still validates every pick and ignores it when the field is not editable or the icon is not allowed. With neither `iconCatalog` nor `renderIconField`, the icon is shown as text only.


## Localization and styling

`labels` replaces any of the editor's strings; the functions receive the item's label so each control names its item. `pt` passes attributes to the stable parts: `root`, `section`, `sectionTitle`, `list`, `item`, `handle`, `moveUp`, `moveDown`, `label`, `icon`, `destination`, `remove`, `add`, `message`, `state`, `empty` and `status`. An item carries `data-locked`, `data-dragging` and `data-drop-position`. Long labels wrap, and in a narrow panel the controls of an item stack.
