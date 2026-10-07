---
title: Tree layout
description: Edit the properties of a JSON Schema inline as a tree, with concepts, a key, required properties, and extension points for products.
---

`<SchemaEditor layout='tree' />` edits the properties of a JSON Schema as a tree. Each property is a row with a name, a type and, for objects and lists of objects, its own nested properties. There is no drill-down and no Edit, Save and Cancel workflow: every edit applies at once and is reported through `onChange`.

The default layout, `layout='table'`, is unchanged. See [Which layout](index.md#which-layout) to choose between them.

## Quick start

```tsx
import { useState } from 'react';
import { SchemaEditor, type JsonSchema } from '@cratis/components/SchemaEditor';

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

    return <SchemaEditor layout='tree' schema={schema} allowRequired onChange={setSchema} />;
}
```

The editor converts `schema` into a tree, keeps the edited tree itself, and calls `onChange` with the complete schema after every edit. Handing the reported schema back, or the same schema again, changes nothing. A schema that differs from both replaces the tree, and with it the property ids.

## Capabilities

| Capability | How to turn it on | Layouts |
| --- | --- | --- |
| Add, rename, retype and remove properties, nested objects and lists of objects | On by default | both (the table drills into nested objects) |
| Concepts as property types (`x-concept`) | `concepts`, or wrap the editor in `PropertyConceptsProvider` | tree |
| Whether a property must be present (`required`) | `allowRequired` | both |
| The key that identifies an object (`x-key`, at most one per object) | `allowKeyProperty` | both |
| Properties that cannot be renamed or removed | `isPropertyProtected` | both |
| Extra name checks | `validatePropertyName` | both |
| Rename and removal notifications | `onPropertyRenamed`, `onPropertyRemoved` | both |
| Content above and below the editor | `header`, `footer` | both |
| Showing the tree without editing it | `readOnly` | tree |
| Per-row slots, selection, controlled mode, `pt` | see [Extending the editor](extending.md) | tree |

## Props of the tree layout

| Prop | Purpose |
| --- | --- |
| `schema`, `onChange` | Schema in, complete schema out. The editor keeps the tree |
| `properties`, `onAddProperty`, `onDeleteProperty`… | [Controlled mode](extending.md#controlled-mode): the host owns the tree and applies each edit |
| `concepts` | The concepts offered as property types |
| `allowRequired`, `allowKeyProperty`, `readOnly` | Opt-in features |
| `isPropertyProtected`, `validatePropertyName` | Per-property restrictions and extra name checks |
| `selectedPropertyId`, `onPropertyClick` | Row selection, owned by the host |
| `header`, `footer` | Content above the tree and beside the add button |
| `renderPropertyLeading`, `renderPropertyAccessory`, `renderPropertyDetails`, `renderPropertyTypeBadge`, `getPropertyRowState` | Per-row [extension points](extending.md#extension-points) |
| `onPropertiesChange`, `onPropertyRemoved`, `onPropertyRenamed` | Notifications for hosts that keep state beside the tree |
| `labels` | Every visible and accessible string |
| `pt`, `className`, `aria-label`, `aria-labelledby` | Styling parts and the accessible name |

## Editing

**Add a property** with the button under the tree, or under a nested object, and pick a type from the menu: the primitives, then the concepts, then the composite types. A new property is named `property<n>` (`nested<n>` for an object or a list of objects); a property added as a concept is named after it, so `CustomerId` becomes `customerId`.

**Rename a property** by double-clicking the name or pressing `F2`. Enter commits and Escape cancels. A name is rejected, with its reason in text and `aria-invalid` on the input, when it is blank, is `__proto__`, `constructor` or `prototype`, or is already used by a sibling. Naming style is a product decision: pass `validatePropertyName` and return the message to show.

**Change the type** by selecting the type badge. Choosing a primitive clears the concept. Changing to an object or a list of objects keeps the children the property had; any other type drops them.

**Concepts** name a domain value that wraps one primitive, such as `CustomerId` over text. A property typed as a concept is written as the primitive plus `x-concept`, so a reader that does not know concepts still sees a valid schema. With concepts enabled but none defined, the menu shows a disabled `noConcepts` hint.

```tsx
import { SchemaEditor, PropertyType } from '@cratis/components/SchemaEditor';

const concepts = [
    { name: 'CustomerId', type: PropertyType.String },
    { name: 'Quantity', type: PropertyType.Number },
];

<SchemaEditor layout='tree' schema={schema} concepts={concepts} />;
```

**Required** (`allowRequired`) adds each property to, or removes it from, the `required` list of its object. Presence is not value validation: an empty string satisfies `required`.

**Key** (`allowKeyProperty`) writes `x-key: true` on one property of an object. Choosing another property moves the key, and choosing the key again clears it. Pass a function to offer the toggle on some properties only.

## Styling

Import `@cratis/components/SchemaEditor/styles`, or the aggregate `@cratis/components/styles`. The tree is styled only with `--cratis-*` tokens. Its stable `data-cratis-part` names, which `pt` also accepts attributes for, are `root`, `header`, `list`, `property`, `row`, `leading`, `name`, `nameInput`, `badge`, `typeButton`, `menu`, `menuItem`, `required`, `key`, `accessory`, `remove`, `protected`, `details`, `add`, `empty`, `message` and `footer`.

## Localization

Labels are the same `labels` prop as the table layout. The tree adds optional keys; anything you leave out stays English. Labels that act on one property are functions that receive its name, such as `deletePropertyFor`, `propertyNameFor` and `addPropertyTo`.

```tsx
<SchemaEditor
    layout='tree'
    schema={schema}
    labels={{
        addProperty: 'Legg til egenskap',
        deletePropertyFor: name => `Slett ${name}`,
        typeString: 'Tekst',
    }}
/>
```

## Accessibility

- The tree is nested lists; every control is a real button, input or checkbox in the tab order.
- A name is renamed with a double click or `F2` (announced through `aria-keyshortcuts`); a rejected name stays in the input with its reason in an alert.
- The type menu is a React Aria menu: arrow keys, typeahead, Escape, and focus returns to its button.
- The key toggle is a toggle button (`aria-pressed`), and a type is always shown as text.
