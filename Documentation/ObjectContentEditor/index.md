---
title: ObjectContentEditor for inspecting and editing JSON
description: ObjectContentEditor displays JSON in a property table, browses nested objects and arrays, and edits top-level values with limited validation.
---

`ObjectContentEditor` is a React component in Cratis Components for inspecting JSON as a property table and editing top-level primitive values. Use it to review a response or snapshot without reading raw JSON. Breadcrumbs, a clickable path through the data, let users return from nested objects and arrays to their parent.

ObjectContentEditor belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles). It uses React and DOM rendering without Pixi; the package's declared peer requirements still apply.

## Purpose

Use view mode to let users inspect a record, including its nested data. Supply a schema to choose which top-level fields appear. For a form that changes those fields, enable edit mode and keep the updated object in your application's state. Editing nested values and persisting changes belong to your application.

## JSON Schema support

Pass a `JsonSchema` from `@cratis/components/types`. ObjectContentEditor shares that contract with [`SchemaEditor`](../SchemaEditor/index.md), but reads only the top-level `properties` and each property's `type`, `format`, and `description` for rendering. It is not a general-purpose JSON Schema validator.

The table changes how it chooses rows as users navigate:

- At Root, one row is rendered per entry in `schema.properties`, in that order. Keys of `object` that the schema does not list are not shown. Include a `type` on each property to enable its edit control and description tooltip.
- Inside a nested object or array, rows come from the data itself. Nested `properties`, `items`, and `required` do not control display, editing, or validation.

Although the shared contract carries `required`, `definitions`, and `$ref`, ObjectContentEditor does not resolve references or use `required` to decide which fields need values in edit mode. Composition keywords, `enum`/`const`, numeric and string constraints, and `additionalProperties` have no effect here. Boolean schemas are outside the supported shape. For the shared type's fields, see [SchemaEditor: JSON Schema support](../SchemaEditor/index.md#json-schema-support); for the checks on edited values, see [Validation](#validation).

<a id="key-features"></a>

## Inspect a record in view mode

The component starts in read-only view mode. Users open nested objects and arrays from the table, then use [`ObjectNavigationalBar`](../ObjectNavigationalBar/index.md) to return to a parent. Arrays of objects appear as stacked key/value groups, so users can inspect several records without opening each one separately.

Property descriptions appear as tooltips beside top-level names. Non-null primitive values appear as plain text (`String(value)`): a date-time string or URI stays a raw string, not a formatted date or link. Null and missing values appear blank. Supply `timestamp` when the data represents a snapshot and users need to know when it was captured.

## Quick Start

Pass the object you want to inspect and a schema listing its top-level fields. This example opens in view mode:

```tsx
import { ObjectContentEditor } from '@cratis/components/ObjectContentEditor';
import type { JsonSchema } from '@cratis/components/types';

export function MyObjectViewer() {
    const data = {
        id: 'user-123',
        name: 'Sample User',
        email: 'sample.user@example.invalid',
        profile: {
            age: 30,
            city: 'Oslo'
        }
    };

    const schema: JsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'guid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            profile: {
                type: 'object',
                properties: {
                    age: { type: 'integer' },
                    city: { type: 'string' }
                }
            }
        }
    };

    return <ObjectContentEditor object={data} schema={schema} timestamp={new Date()} />;
}
```

The table lists `id`, `name`, `email`, and `profile`. The `profile` row shows an "Object" button; activating it moves the breadcrumb to `Root > profile` and lists `age` and `city`. The timestamp appears below the table as "Snapshot captured: …".

## Props

### Required Props

- `object`: The JSON object to display
- `schema`: `JsonSchema` selecting the top-level rows and their edit controls

### Optional Props

- `timestamp`: Date shown below the table as "Snapshot captured: …" (formatted with `toLocaleString()`)
- `editMode`: When `true`, renders edit controls for typed top-level primitive properties (default: `false`)
- `onChange`: `ChangeHandler<Json>`, called with the full updated object and change metadata after any field edit. ObjectContentEditor is controlled: without `onChange`, edits are not kept.
- `onValidationChange`: Called with `true` when the editor has field errors, `false` when it has none; only called when `editMode` is `true`. This reports the limited checks below, not full schema validity.
- `className`: Extra class names on the root, which always has the `order-content` class

The component's own texts ("Root", "Snapshot captured", "Object", "Empty array", the validation messages) are English, and there is no `labels` prop.

## Edit Mode

Enable `editMode` to change top-level primitive properties using their schema type and format. Pass `onChange` and feed the returned object back through `object`; the editor does not retain the new values for you. Every input's accessible name is its property name.

Return to Root before editing. Switching `editMode` does not reset the navigation path, and nested rows remain a data-only view.

### Input field types

| Schema type / format | Input rendered |
|---|---|
| `boolean` | Checkbox |
| `number` / `integer` | Number input |
| `string` / `date-time` | Date + time picker; stores an ISO 8601 string (`toISOString()`) |
| `string` / `date` | Date picker; stores the date part of `toISOString()` (`YYYY-MM-DD`, in UTC) |
| `string` (> 50 chars) | Textarea |
| `string` (any other) | Text input |
| `array` | The text "Array editing not yet supported" |
| `object` | The text "Object editing not yet supported" |

At Root in edit mode, typed `array` and `object` properties show that text instead of navigation buttons. Switch to view mode to open them; their nested values have no edit controls.

### Validation

Validation runs in edit mode at Root, on field changes and when `object`, `schema`, `editMode`, or the navigation path changes. Every top-level property in `schema.properties` needs a value, even if it is absent from `schema.required`.

| Check | Error text |
| --- | --- |
| Empty string, `null`, or missing top-level value | "This field is required" |
| String with `format: 'email'` failing a basic email pattern | "Invalid email format" |
| String with `format: 'uri'` not matching an `http://` or `https://` prefix followed by content | "Invalid URI format" |
| `number` or `integer` value for which `Number(value)` is `NaN` | "Must be a valid number" |

These checks do not enforce integer-only values, general JSON type matching, date validity, or formats such as `guid`. Nested values are not validated, and view mode runs no validation. Use your application's validator before persistence when you need those checks or the full JSON Schema rules.

Validation errors are displayed inline beneath each field, tinted with the `--cratis-red-500` token, and the offending input gets `aria-invalid` (the date pickers get their `invalid` state). The error text is not linked to the input with `aria-describedby`. Override [`--cratis-red-500`](../Styling/cratis-tokens.md) to retint them.

### Edit Mode Example

Keep the edited object in React state and use `onValidationChange` to control whether Save is enabled:

```tsx
import { useState } from 'react';
import { ObjectContentEditor } from '@cratis/components/ObjectContentEditor';
import type { Json, JsonSchema } from '@cratis/components/types';

const productSchema: JsonSchema = {
    type: 'object',
    required: ['name', 'price'],
    properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        inStock: { type: 'boolean' },
        releaseDate: { type: 'string', format: 'date-time' },
        website: { type: 'string', format: 'uri' },
    },
};

export function EditableProduct() {
    const [product, setProduct] = useState<Json>({
        name: 'Laptop Pro',
        price: 1299.99,
        inStock: true,
        releaseDate: '2024-01-15T10:00:00Z',
        website: 'https://example.invalid',
    });
    const [hasErrors, setHasErrors] = useState(false);

    return (
        <>
            <ObjectContentEditor
                object={product}
                schema={productSchema}
                editMode
                onChange={(value) => setProduct(value)}
                onValidationChange={setHasErrors}
            />
            <button type='button' disabled={hasErrors}>
                Save
            </button>
        </>
    );
}
```

`onChange` replaces the example's local `product` state with the full updated object. Type that state as `Json`: the callback is a `ChangeHandler<Json>`, so a setter for a narrower inferred shape (`useState({ name: '…' })`) does not type-check. Validate and convert the value to your domain type where you persist it.

The example only enables or disables Save; it has no save handler. Add your persistence action there. Despite `required: ['name', 'price']`, the editor also requires values for `inStock`, `releaseDate`, and `website`, because it checks every top-level property.

## Navigation

### Breadcrumb Trail

ObjectContentEditor renders an [`ObjectNavigationalBar`](../ObjectNavigationalBar/index.md) above the table and keeps the navigation path in its own state. The host cannot set or read the path. The bar shows the current location:

```text
Root > profile > address > city
```

- Click "Root" to return to top level
- Click any segment to jump to that level
- Click back arrow to go up one level

### Nested Objects

In view mode, object values show an "Object" button and arrays an "Array[n]" button. Activate one to navigate into it:

```text
Root
  name       Product A
  metadata   Object →

Root > metadata
  created    2024-01-01
  tags       Array[2] →
```

An array of primitives lists its items as `[0]`, `[1]`, …; an array of objects shows each item as a group of key/value rows, using the keys of the first item. Keys found only in later items are not shown. Nested objects and arrays within those rows can be opened too.

An empty array shows "Empty array". If a changed `object` makes the current path missing, null, or primitive, the editor returns to Root.

### Navigation Examples

```text
Navigate to a nested object:   profile → address
Navigate into an array:        tags → [0], [1], … listed as rows
Return to a parent:            the back arrow or a breadcrumb segment
```

## Complete Example

This product record combines primitive fields with an object and an array. Use the `specs` and `tags` buttons to inspect the nested values:

```tsx
import { ObjectContentEditor } from '@cratis/components/ObjectContentEditor';
import type { JsonSchema } from '@cratis/components/types';

export function ProductViewer() {
    const product = {
        id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
        name: 'Laptop Pro',
        price: 1299.99,
        inStock: true,
        specs: {
            cpu: 'M2 Pro',
            ram: '16GB',
            storage: '512GB'
        },
        tags: ['electronics', 'computers', 'featured'],
        website: 'https://example.invalid/laptop-pro',
        releaseDate: '2024-01-15T10:00:00Z'
    };

    const schema: JsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'guid' },
            name: { type: 'string' },
            price: { type: 'number' },
            inStock: { type: 'boolean' },
            specs: {
                type: 'object',
                properties: {
                    cpu: { type: 'string' },
                    ram: { type: 'string' },
                    storage: { type: 'string' }
                }
            },
            tags: {
                type: 'array',
                items: { type: 'string' }
            },
            website: { type: 'string', format: 'uri' },
            releaseDate: { type: 'string', format: 'date-time' }
        }
    };

    return (
        <ObjectContentEditor
            object={product}
            schema={schema}
            timestamp={new Date()}
        />
    );
}
```

## Use Cases

Use view mode to inspect a response, application settings, or a historical snapshot. The host supplies the data; ObjectContentEditor does not fetch records or build an audit history. Add a timestamp when the supplied object represents a captured state.

Edit mode suits changes to a record's top-level primitive fields. If users must edit nested structures or rely on complete schema validation, provide that editing workflow and validation separately.

## Best Practices

Choose the visible top-level fields deliberately: leaving a key out of `schema.properties` hides it at Root. That does not filter nested data, which is displayed using its own keys. Prepare the object before passing it in if some nested values should not be shown.

Use `date` and `date-time` to select date inputs, and `email` and `uri` for their edit-time checks. Those formats do not change how values appear in view mode. Keep application validation beside your save action rather than treating the editor's error callback as proof that the whole record is valid.

## Integration with Other Components

To inspect a selected row beside a list, render ObjectContentEditor in a [DataPage details panel](../DataPage/details-panel.md). For historical data, use it as the snapshot `content` in [TimeMachine's read model view](../TimeMachine/views.md#read-model-view). In each case, your application supplies the object and its schema.

For a modal editing workflow, place the editor inside a [Dialog](../Dialogs/dialog.md) and decide how validation and confirmation lead to saving. If users need to change field definitions instead of values, use [SchemaEditor](../SchemaEditor/index.md).

## Schema Requirements

For the object-table workflow shown above, pass a schema with:

- `type: 'object'` at root
- `properties` defining each top-level property's type and format
- An optional `required` array; it is accepted but does not change what ObjectContentEditor validates
- Nested schemas for object and array types, if other tools need them; ObjectContentEditor does not read them

This structure selects the table's rows and controls; it does not make the editor a full schema validator. [JSON Schema support](#json-schema-support) explains which fields it reads.

## Performance Considerations

The table renders all rows for the current location. There is no virtualization or paging, so limit large arrays before passing them in; ObjectContentEditor cannot page through them for you. For deeply nested data, consider whether a smaller object would let users reach the relevant values more directly.

At Root in edit mode, validation reruns for every top-level property when `object` or `schema` changes. Keep an unchanged schema reference stable, for example as a module constant or with `useMemo`, to avoid rerunning those checks just because the parent rendered.
