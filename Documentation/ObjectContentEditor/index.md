---
title: ObjectContentEditor
description: Explore complex JSON objects with schema-aware rendering and breadcrumb navigation.
---

The `ObjectContentEditor` component shows a JSON object as a property table driven by a JSON schema, lets users drill into nested objects and arrays, and can edit top-level primitive properties.

ObjectContentEditor belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency and no separate peer to install.

## Purpose

ObjectContentEditor provides a structured view of JSON objects with breadcrumb navigation for exploring nested objects and arrays, rendering properties according to a JSON schema.

## JSON Schema support

ObjectContentEditor renders against the same `JsonSchema`/`JsonSchemaProperty` contract as [`SchemaEditor`](../SchemaEditor/index.md) — see [SchemaEditor: JSON Schema support](../SchemaEditor/index.md#json-schema-support) for the exact supported subset (type/format/description/properties/items/required/definitions/$ref) and what is intentionally not supported (composition keywords, `enum`/`const`, numeric/string constraints, `additionalProperties`, boolean schemas). A property whose schema uses an unsupported keyword still renders by its `type`/`format`; the unsupported keyword itself has no effect on rendering or validation here.

The schema is only consulted for the top level of the object:

- At the top level, one row is rendered per entry in `schema.properties`, in that order. Keys of `object` that the schema does not list are not shown.
- After navigating into a nested object or array, rows come from the data itself. Nested `properties`, `items`, and `required` are not used for display, editing, or validation.

## Key Features

- Top-level rows taken from `schema.properties`, with each property's `description` as a tooltip
- Breadcrumb navigation into nested objects and arrays, through [`ObjectNavigationalBar`](../ObjectNavigationalBar/index.md)
- Arrays of objects shown as stacked key/value groups
- An optional "Snapshot captured" timestamp
- An edit mode with type- and format-specific inputs for top-level primitive properties
- Read-only viewing mode (the default)

In view mode, primitive values are shown as plain text (`String(value)`): a date-time string or a URI is displayed as the raw string, not formatted or linked.

## Quick Start

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
- `schema`: JSON schema defining the object's structure

### Optional Props

- `timestamp`: Date shown below the table as "Snapshot captured: …" (formatted with `toLocaleString()`)
- `editMode`: When `true`, renders editable input fields for each top-level property (default: `false`)
- `onChange`: `ChangeHandler<Json>`, called with the full updated object and change metadata after any field edit. ObjectContentEditor is controlled: without `onChange`, edits are not kept.
- `onValidationChange`: Called with `true` when any field has a validation error, `false` when all fields are valid — only called when `editMode` is `true`
- `className`: Extra class names on the root, which always has the `order-content` class

The component's own texts ("Root", "Snapshot captured", "Object", "Empty array", the validation messages) are English, and there is no `labels` prop.

## Edit Mode

When `editMode` is `true`, each top-level property is rendered as an editable input field appropriate for its schema type and format. Every input's accessible name is its property name.

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

In edit mode, `array` and `object` properties show that text instead of the navigation button, so nested data can only be browsed in view mode.

### Validation

Validation runs only in edit mode, at the top level: on every field change, and whenever `object`, `schema`, or `editMode` changes.

- **Every** top-level property in `schema.properties` is treated as required: an empty string, `null`, or missing value is flagged with "This field is required". `schema.required` does not change this.
- `string` fields with `format: 'email'` are validated against a basic email pattern ("Invalid email format").
- `string` fields with `format: 'uri'` must start with `http://` or `https://` ("Invalid URI format").
- `number` / `integer` fields must be valid numbers ("Must be a valid number").

In view mode nothing is validated.

Validation errors are displayed inline beneath each field, tinted with the `--cratis-red-500` token, and the offending input gets `aria-invalid` (the date pickers get their `invalid` state). The error text is not linked to the input with `aria-describedby`. Override [`--cratis-red-500`](../Styling/cratis-tokens.md) to retint them.

### Edit Mode Example

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

Type the state as `Json`. `onChange` is a `ChangeHandler<Json>`, so passing the setter of a state typed as your own object shape (`useState({ name: '…' })`) does not type-check. Convert the `Json` value to your domain type where you persist it.

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

An array of primitives lists its items as `[0]`, `[1]`, …; an array of objects shows each item as a group of key/value rows, using the keys of the first item. An empty array shows "Empty array". If `object` changes so the current path no longer exists, the editor returns to Root.

### Navigation Examples

```text
Navigate to a nested object:   profile → address
Navigate into an array:        tags → [0], [1], … listed as rows
Return to a parent:            the back arrow or a breadcrumb segment
```

## Complete Example

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

- **Data inspection**: View complex API response data
- **Configuration display**: Show application settings
- **Audit trails**: Display historical data states
- **Debugging**: Explore runtime object structures
- **Documentation**: Display example data structures
- **Data validation**: Review data against schema
- **User profiles**: Display nested user information
- **Product catalogs**: Show product details and metadata

## Best Practices

1. **Provide complete schema**: only top-level properties listed in `schema.properties` are shown
2. **Use formats for editing**: `date`, `date-time`, `email`, and `uri` change the edit input or its validation; view mode shows raw values
3. **Structure deeply nested data**: Keep nesting reasonable (3-4 levels max)
4. **Timestamp important data**: Include timestamp for temporal context
5. **Keep objects focused**: Don't display overly large objects (use pagination)
6. **Use consistent property names**: Follow naming conventions
7. **Validate data against schema**: Ensure data matches schema structure

## Integration with Other Components

ObjectContentEditor works well with:

- **TimeMachine**: Display read model states at each version
- **DataPage**: Show detail panel content
- **Dialogs**: Display object details in modal
- **SchemaEditor**: Use schema created by editor

## Schema Requirements

The schema should be a valid JSON Schema with:

- `type: 'object'` at root
- `properties` defining each top-level property's type and format
- An optional `required` array; it is accepted but does not change what ObjectContentEditor validates
- Nested schemas for object and array types, if other tools need them; ObjectContentEditor does not read them

This requirement list describes structure, not the full supported keyword set — see [JSON Schema support](#json-schema-support) above for exactly which JSON Schema keywords `ObjectContentEditor` reads.

## Performance Considerations

- Every property and array item renders as a table row; there is no virtualization or paging, so trim large arrays before passing them in
- Deep nesting can be difficult to navigate with breadcrumbs alone
- In edit mode, validation reruns for every top-level property whenever `object` or `schema` changes, so keep `schema` stable (a module constant or `useMemo`)
