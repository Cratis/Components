# SchemaEditor

The `SchemaEditor` component provides an interactive table-based interface for creating and editing JSON schemas.

SchemaEditor belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles) — a specialized, React-only surface with no Pixi dependency and no separate peer to install.

## Purpose

SchemaEditor lets users define data structures by adding properties, choosing supported types and formats, and navigating nested object/array schemas in a table interface.

## Key Features

- Interactive property editing
- Type selection from JSON schema types
- Format specification for common patterns
- `required` array tracking per object schema, kept consistent across renames and deletes (see [Editing Properties](editing.md#required-properties) — no in-table toggle control yet)
- Array and object type support
- Inline editing with validation
- Add/remove properties
- Read-only mode support

## Quick Start

```tsx
import { useState } from 'react';
import { SchemaEditor } from '@cratis/components/SchemaEditor';
import type { JsonSchema } from '@cratis/components/types';

export function MySchemaEditor() {
    const [schema, setSchema] = useState<JsonSchema>({
        type: 'object',
        properties: {
            name: { type: 'string' },
            age: { type: 'number' },
        },
        required: ['name'],
    });

    return <SchemaEditor schema={schema} onChange={setSchema} />;
}
```

## Basic Schema Structure

The component works with JSON schemas following the JSON Schema specification:

```json
{
    "type": "object",
    "properties": {
        "propertyName": {
            "type": "string",
            "format": "date"
        }
    },
    "required": ["propertyName"]
}
```

## JSON Schema support

SchemaEditor and [`ObjectContentEditor`](../ObjectContentEditor/index.md) share one `JsonSchema`/`JsonSchemaProperty` contract (`@cratis/components/types`), and it is a **pragmatic authoring subset of JSON Schema, not a general-purpose validator**. The supported shape is exactly what the types declare:

- `title`, `name`, `$id`, `$ref`, `type`, `format`, `description`
- `properties` and `items` (recursively, for `object` and `array`)
- `required` (a string array on every object schema, including an object-valued property, naming required children in that same `properties` object)
- `definitions`, for schemas reused via `$ref`

The type editor offers `string`, `integer`, `number`, and `boolean` as leaf types, plus `array` and `object` as container types, with the built-in format catalog (`DEFAULT_TYPE_FORMATS`, also exported from `types`): `guid`, `date-time`, `date`, and `time` for `string`; `int16`, `int32`, and `int64` for `integer`; `float` and `double` for `number`.

What is deliberately **not** supported: JSON Schema composition keywords (`oneOf`, `anyOf`, `allOf`, `not`), `enum`/`const`, numeric or string constraints (`minimum`, `maximum`, `minLength`, `maxLength`, `pattern`), `additionalProperties`/`patternProperties`, and boolean schemas (`true`/`false` in place of a schema object). SchemaEditor does not display, edit, or validate these keywords. Unrelated unknown properties are generally preserved by its clone-and-spread mutation paths, but a targeted type change intentionally rewrites fields such as `type`, `format`, `items`, or `properties` and may leave richer external constraints inconsistent. Validate edited schemas with the application's authoritative validator, or use a dedicated editor when richer vocabulary support is required.

## Table Interface

Properties are displayed in a table:

| Property  | Type      |
| --------- | --------- |
| name      | string    |
| email     | email     |
| age       | number    |
| createdAt | date-time |

The Type column shows the property's format when one is set, falling back to
its JSON type otherwise. There is no separate Required column; see
[Editing Properties](editing.md#required-properties) for how `required` is
tracked.

## See Also

- [Editing Properties](editing.md) - Add, modify, and remove properties
- [Types and Formats](types-formats.md) - Available types and format options
- [Validation](validation.md) - Validation rules and constraints
