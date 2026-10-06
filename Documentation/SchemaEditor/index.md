---
title: SchemaEditor
description: Edit the properties of a JSON Schema as a tree, with concepts, a key, required properties, and slots for product-specific features.
---

`SchemaEditor` edits the properties of a JSON Schema as a tree: each property is a row with a name, a type, and — for objects and lists of objects — its own nested properties.

SchemaEditor belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency and no separate peer to install.

## Quick start

```tsx
import { useState } from 'react';
import { SchemaEditor, type JsonSchema } from '@cratis/components/SchemaEditor';
import '@cratis/components/SchemaEditor/styles';

const initial: JsonSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        age: { type: 'number' },
    },
    required: ['name'],
};

export function OrderSchema() {
    const [schema, setSchema] = useState(initial);

    return <SchemaEditor schema={schema} allowRequired onChange={setSchema} />;
}
```

The editor converts `schema` into a tree, keeps the edited tree itself, and calls `onChange` with the complete schema after every edit. Handing the reported schema back, or the same schema again, changes nothing. A schema that differs from both — loaded from somewhere else, say — replaces the tree, and with it the property ids.

## What it edits

| Capability | How to turn it on |
| --- | --- |
| Add, rename, retype and remove properties, nested objects and lists of objects | On by default |
| Concepts as property types (`x-concept`) | Pass `concepts`, or wrap the editor in `PropertyConceptsProvider` |
| Whether a property must be present (`required`) | `allowRequired` |
| The key that identifies an object (`x-key`) | `allowKeyProperty` |
| Properties that cannot be renamed or removed | `isPropertyProtected` |
| Showing the tree without editing it | `readOnly` |

The editor owns a single concern: the shape of the schema. Rules, mapping, and the surrounding chrome of a product attach through [slots and callbacks](extending.md).

## Props

| Prop | Purpose |
| --- | --- |
| `schema`, `onChange` | Schema in, complete schema out. The editor keeps the tree |
| `properties`, `onAddProperty`, `onDeleteProperty`… | [Controlled mode](extending.md#controlled-mode): the host owns the tree and applies each edit |
| `concepts` | The concepts offered as property types |
| `allowRequired`, `allowKeyProperty`, `readOnly` | Opt-in features |
| `isPropertyProtected`, `validatePropertyName` | Per-property restrictions and extra name checks |
| `selectedPropertyId`, `onPropertyClick` | Row selection, owned by the host |
| `header`, `footer` | Content above the tree and beside the add button |
| `renderPropertyLeading`, `renderPropertyAccessory`, `renderPropertyDetails`, `getPropertyRowState` | Per-row [extension points](extending.md#extension-points) |
| `onPropertiesChange`, `onPropertyRemoved`, `onPropertyRenamed` | Notifications for hosts that keep state beside the tree |
| `labels` | Every visible and accessible string |
| `pt`, `className`, `aria-label`, `aria-labelledby` | Styling parts and the accessible name |

## Styling

Import `@cratis/components/SchemaEditor/styles`, or the aggregate `@cratis/components/styles`. The editor is styled only with `--cratis-*` tokens. Its stable `data-cratis-part` names, which `pt` also accepts attributes for, are `root`, `header`, `list`, `property`, `row`, `leading`, `name`, `nameInput`, `badge`, `typeButton`, `menu`, `menuItem`, `required`, `key`, `accessory`, `remove`, `protected`, `details`, `add`, `empty`, `message` and `footer`. A selected row carries `data-selected`, a pressed key toggle `data-pressed`, an invalid name input `data-invalid`, and a read-only root `data-readonly`.

## Localization

Every string the editor shows or announces comes from `labels`; anything you leave out stays English. Labels that act on one property are functions that receive its name, so each control names the property it belongs to.

```tsx
<SchemaEditor
    schema={schema}
    labels={{
        addProperty: 'Legg til egenskap',
        deleteProperty: name => `Slett ${name}`,
        typeString: 'Tekst',
    }}
/>
```

## Accessibility

- The tree is nested lists; every control is a real button, input or checkbox in the tab order.
- A name is renamed with a double click or with `F2` (announced through `aria-keyshortcuts`). Enter commits, Escape cancels, and a rejected name stays in the input with its reason in an alert.
- The type menu is a React Aria menu: arrow keys, typeahead, Escape, and focus returns to its button.
- The key toggle is a toggle button (`aria-pressed`), and a type is always shown as text, never only as a color or a glyph.

## See also

- [Editing properties](editing.md)
- [JSON Schema mapping](json-schema.md)
- [Extending the editor](extending.md)
- [Migrating from the table editor](../Migration/4-to-5.md)
