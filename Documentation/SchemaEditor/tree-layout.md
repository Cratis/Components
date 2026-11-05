---
title: SchemaEditor tree layout for nested properties
description: Edit nested JSON Schema properties inline with SchemaEditor's tree layout. Handle live changes, required fields, concepts, and host-owned persistence.
---

SchemaEditor's tree layout lets users edit nested JSON Schema properties together without opening a separate table for each object. Each row has a name and type, with children shown inline for objects and lists of objects. Edits apply immediately; your application owns persistence and any Save or Cancel workflow.

Use `<SchemaEditor layout='tree' />` to select it. If users need the editor's built-in Edit, Save and Cancel actions, choose the default [table layout](index.md#which-layout) instead.

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

The editor converts `schema` into a property tree, keeps that tree internally, and calls `onChange` with the complete schema after each edit. The example stores that result in React state; it does not persist it.

Passing back the last emitted schema, or the same incoming schema, leaves the tree and its property ids intact. A schema whose contents differ from both replaces the tree and generates new ids. Keep persisted references by property name, not by these editing-session ids.

For a form with Save and Cancel, retain an original schema separately from the draft. Save persists the draft; Cancel must restore host state and replace or reset the editor as needed. There is no built-in history or discard action. A host that needs to apply every edit itself can instead supply `properties` and callbacks in [controlled mode](extending.md#controlled-mode).

## Capabilities

| Capability | How to turn it on | Layouts |
| --- | --- | --- |
| Add, rename, retype and remove properties, nested objects and lists of objects | On by default | both (the table drills into nested objects) |
| Concepts as property types (`x-concept`) | `concepts`, or wrap the editor in `PropertyConceptsProvider` | tree |
| Whether a property must be present (`required`) | `allowRequired` | both |
| The key that identifies an object (`x-key`, at most one per object) | `allowKeyProperty` | both |
| Generated values (`x-generated`) | `allowGeneratedProperty` | tree |
| Properties that cannot be renamed or removed | `isPropertyProtected` | both |
| Extra name checks | `validatePropertyName` | both |
| Rename and removal notifications | `onPropertyRenamed`, `onPropertyRemoved` | both |
| Content above and below the editor | `header`, `footer` | both |
| Showing the tree without editing it | `readOnly` | tree |
| Per-row slots, selection, controlled mode, `pt` | see [Extending the editor](extending.md) | tree |

## Props of the tree layout

| Prop | Purpose |
| --- | --- |
| `schema`, `onChange` | Schema in, complete schema out; the editor owns the working tree in this mode |
| `properties`, `onAddProperty`, `onDeleteProperty`… | [Controlled mode](extending.md#controlled-mode): the host owns the tree and applies each edit |
| `concepts` | The concepts offered as property types |
| `allowRequired`, `allowKeyProperty`, `allowGeneratedProperty` | Opt-in editing controls |
| `readOnly` | Hides mutation controls while keeping the tree visible |
| `isPropertyProtected`, `validatePropertyName` | Per-property restrictions and extra name checks |
| `selectedPropertyId`, `onPropertyClick` | Row selection, owned by the host |
| `header`, `footer` | Content above the tree and beside the add button |
| `renderPropertyLeading`, `renderPropertyAccessory`, `renderPropertyDetails`, `renderPropertyTypeBadge`, `getPropertyRowState` | Per-row [extension points](extending.md#extension-points) |
| `onPropertiesChange`, `onPropertyRemoved`, `onPropertyRenamed` | Notifications for hosts that keep state beside the tree |
| `labels` | Every visible and accessible string |
| `pt`, `className`, `aria-label`, `aria-labelledby` | Styling parts and the accessible name |

## Editing

Add a property with the button under the tree or under a nested object, then pick its type. The menu offers text, number, boolean, date, time and unique identifier, followed by available concepts and the object and list types. A new property is named `property<n>` (`nested<n>` for an object or a list of objects). A concept property takes its name from the concept, so `CustomerId` becomes `customerId`.

To rename a property, double-click its name or focus the name and press `F2`. Enter commits a valid name; Escape cancels. Blank names, reserved prototype keys (`__proto__`, `constructor`, `prototype`) and duplicate sibling names are rejected. The input shows the reason and sets `aria-invalid`. Unlike the table, the tree does not impose an identifier naming style. Pass `validatePropertyName` if your application needs one.

Select the type badge to change a property's type. Choosing a primitive clears its concept. Moving to an object or a list of objects keeps existing children; moving to any other type drops them. The tree's menu does not use `typeFormats`. Its Number type represents both incoming `integer` and `number` schemas; unchanged properties retain their original type and format, as described in [JSON Schema mapping](json-schema.md).

A concept gives a domain name to a primitive value, such as `CustomerId` over text. The schema still carries the primitive type, with `x-concept` identifying the concept. Supply `concepts` directly, as below, or use `PropertyConceptsProvider`. With concepts enabled but none defined, the menu shows a disabled `noConcepts` hint.

```tsx
import { SchemaEditor, PropertyType } from '@cratis/components/SchemaEditor';

const concepts = [
    { name: 'CustomerId', type: PropertyType.String },
    { name: 'Quantity', type: PropertyType.Number },
];

<SchemaEditor layout='tree' schema={schema} concepts={concepts} />;
```

Enable `allowRequired` to let users add a property to, or remove it from, its object's `required` list. This requires presence, not a non-empty value: `required` alone permits an empty string. Requiring a nested property does not require its parent.

Enable `allowKeyProperty` to mark one property per object with `x-key: true`. Choosing another property moves the key; choosing the current key clears it. Pass a predicate to offer the toggle only on selected properties. The annotation does not validate uniqueness in stored data.

Enable `allowGeneratedProperty` to mark a value as generated rather than entered. The toggle writes `x-generated: true`, and choosing it again clears the keyword. It does not generate a value or run a command; the consuming application gives the annotation its effect. This control is off by default and is not offered by the table layout.

For a per-property policy, pass a predicate. This example offers the toggle on required concept properties, and on already-generated properties so a stale flag can still be cleared:

```tsx
<SchemaEditor
    layout='tree'
    schema={schema}
    allowGeneratedProperty={property => property.isGenerated === true || (property.isRequired === true && Boolean(property.concept))}
    onChange={setSchema}
/>
```

In [controlled mode](extending.md#controlled-mode), supply `onSetGeneratedProperty={(propertyId, isGenerated) => setProperties(current => setGeneratedProperty(current, propertyId, isGenerated))}`. Import `setGeneratedProperty` from `@cratis/components/SchemaEditor`. The callback implies `allowGeneratedProperty` unless you explicitly set it to `false`; without a callback the controlled tree offers no toggle. `readOnly` hides the toggle in either mode. A generated property still shows a non-interactive marker when editing is read-only, the predicate rejects it, or no toggle is offered. The marker uses the same `generated` part and pressed state, with an accessible name. Other edits, including type changes, keep the generated flag.

The tree edits a subset of JSON Schema; it does not validate data or expose controls for every keyword. Unchanged properties retain standard keywords such as `description`, `default`, `enum` and `minLength`, along with unknown `x-` keywords on properties and array `items`. Root metadata is retained, but the root's `type`, `properties` and `required` are rebuilt. Required names with no declared property are dropped.

In controlled mode, keep `vendorKeywords`, `itemVendorKeywords`, `schemaKeywords` and `itemSchemaKeywords` on the properties you store. Original type, format and ordering detail also depends on hidden metadata: retain property objects or use the exported edit helpers rather than cloning them. Retyping can drop constraints, item metadata and original type details. Read [JSON Schema mapping](json-schema.md#changing-a-property-type) for the conversion rules, and validate the output with your application's validator before treating it as authoritative.

## Styling

Use `@cratis/components/SchemaEditor/styles` with the [per-area stylesheet setup](../Styling/per-area-stylesheets.md), or import the aggregate `@cratis/components/styles`. The tree uses `--cratis-*` tokens. Its stable `data-cratis-part` names, which `pt` also accepts attributes for, are `root`, `header`, `list`, `property`, `row`, `leading`, `name`, `nameInput`, `badge`, `typeButton`, `menu`, `menuItem`, `required`, `key`, `generated`, `accessory`, `remove`, `protected`, `details`, `add`, `empty`, `message` and `footer`.

## Localization

Pass `labels` to translate visible text and accessible names. The tree shares this prop with the table and adds optional keys; omitted labels keep their English defaults. Labels that act on a property, such as `deletePropertyFor`, `propertyNameFor` and `addPropertyTo`, are functions receiving its name.

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

The Generated toggle uses `generatedProperty(name)` for its accessible name, `setAsGenerated` for its inactive tooltip, and `isGenerated` for its active tooltip. Defaults are `Generated: <name>`, `Mark as generated: the value is created when the command runs, not entered`, and `The value is generated. Select it again to mark it as entered.`. The non-interactive marker uses `generatedProperty(name)` for its name and tooltip.

## Accessibility

- The tree uses nested lists, with buttons, inputs and checkboxes for its controls.
- Names support double-click or `F2` editing, announced through `aria-keyshortcuts`. Submitting an invalid name with Enter keeps the input open and reports the reason in an alert.
- The type menu is a React Aria menu: arrow keys, typeahead, Escape, and focus returns to its button.
- The key and Generated toggles are toggle buttons (`aria-pressed`), and a type is always shown as text.
