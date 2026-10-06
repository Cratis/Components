---
title: Editing properties
description: Add, rename, retype, nest, require and key properties in SchemaEditor, and what each edit writes.
---

Every edit changes the property tree and reports the whole resulting schema through `onChange`. This page describes each edit and what it writes; see [JSON Schema mapping](json-schema.md) for the reverse direction.

## Add a property

Choose **Add property** under the tree (the `addProperty` label is rendered beside a plus icon, so a translated label must not include `+`), or under a nested object, and pick a type from the menu. The menu offers the primitives (text, number, yes or no, date, time), then the [concepts](#concepts), then the composite types (list of text, list of numbers, object, list of objects).

A new property is named `property<n>` (`nested<n>` for an object or a list of objects), where `n` is one more than the number of properties in the tree. A property added as a concept is named after it instead — `CustomerId` becomes `customerId` — and gets the lowest free number when a sibling already has the name.

## Rename a property

Double-click the name or press `F2` on it. Enter commits the name and Escape or leaving the field cancels it. A name is rejected, with its reason in text and `aria-invalid` on the input, when it is:

- blank;
- `__proto__`, `constructor` or `prototype`, which would shadow members every object inherits;
- already used by a sibling, because both would collapse into one JSON Schema key.

Anything else is accepted. Naming style, such as identifiers only, is a product decision: pass `validatePropertyName` and return the message to show.

```tsx
<SchemaEditor
    schema={schema}
    validatePropertyName={name => /^[a-z][A-Za-z0-9]*$/.test(name) ? undefined : 'Use camelCase.'}
/>
```

A property keeps its requiredness and key when it is renamed.

## Change the type

Select the type badge of a property and pick another type. Choosing a plain primitive clears the concept. Changing to an object or a list of objects keeps the children the property already had; changing to anything else drops them.

## Concepts

A concept names a domain value that wraps one primitive, such as `CustomerId` over text. Pass the concepts the editor may offer:

```tsx
import { SchemaEditor, PropertyType } from '@cratis/components/SchemaEditor';

const concepts = [
    { name: 'CustomerId', type: PropertyType.String },
    { name: 'Quantity', type: PropertyType.Number },
];

<SchemaEditor schema={schema} concepts={concepts} />;
```

When many editors share the same concepts, provide them once with `PropertyConceptsProvider`; an editor's own `concepts` prop takes precedence. The menu lists concepts alphabetically under their own heading, and only when the host opted into concepts, with the `concepts` prop or a provider. When it did but the list is empty, the menu shows the heading with a disabled `noConcepts` hint (**No concepts defined** by default); when it did not, the group is absent. A property typed as a concept is written as the primitive plus `x-concept`, so a reader that does not know concepts still sees a valid schema.

## Required properties

In controlled mode, supplying `onSetRequiredProperty` offers the toggle without `allowRequired`; an explicit `allowRequired={false}` hides it.

With `allowRequired`, each row has a **Required** checkbox. It controls whether the property must be present in its parent object: the name is added to, or removed from, the `required` list of that object — the root, a nested object, or the items of a list of objects. Requiring a nested property does not require its parent.

Presence is not value validation: a present empty string satisfies `required`. New properties are optional, and a key, a concept or a protected name never implies required.

## The key property

In controlled mode, supplying `onSetKeyProperty` offers the toggle without `allowKeyProperty`; an explicit `allowKeyProperty={false}` hides it.

With `allowKeyProperty`, each row has a key toggle. At most one property of an object is the key; choosing another moves it, and choosing the current key again clears it. The key is written as `x-key: true` on the property.

`allowKeyProperty` also accepts a function to decide per property. For example, to offer the key only on nested properties:

```tsx
<SchemaEditor schema={schema} allowKeyProperty={(_property, context) => context.depth > 0} />
```

## Protected properties

`isPropertyProtected` marks properties that can be neither renamed nor removed, such as an identifier every record carries. They show a lock with the explanation in `labels.protectedProperty` instead of a remove button.

## Header placement

`header` renders inside the editor's root, above the list. A host that wants a full-bleed card header, edge to edge with its own background, places that header outside the editor instead of passing it as `header`.

## Read-only

`readOnly` shows the tree with no edit controls: the required checkboxes stay visible but disabled, and the slots receive `context.readOnly`, so they can withhold their own edits.
