---
title: SchemaEditor for editing JSON Schema in React
description: Use SchemaEditor to edit JSON Schema properties in a table or inline tree. Choose the layout, handle changes, and persist schemas in your application.
---

SchemaEditor lets users define a JSON Schema's properties in a React application without editing JSON by hand. Choose the table layout for an Edit, Save and Cancel workflow, or the tree layout to edit nested properties inline. Your application decides when to persist the result.

SchemaEditor belongs to the [Advanced React capability profile](../ui-foundation.md#capability-profiles). It uses React and DOM rendering without Pixi; the package's declared peer requirements still apply.

## Purpose

Use SchemaEditor when a form or design tool needs users to add fields, choose their types, and define nested objects or arrays. It edits the schema that describes data, not the data itself. To edit values against a schema, use [ObjectContentEditor](../ObjectContentEditor/index.md).

## Key Features

Both layouts let users add, rename, retype and remove properties. Optional Required and Key controls mark which properties must be present and which one identifies an object. Renaming or deleting a property keeps its object's `required` list consistent.

The layouts differ in how users navigate and commit edits. Pick that workflow first, then add name validation or property restrictions through [Extending the editor](extending.md).

## Which layout

Set `layout` to choose the editing workflow. Omitting it selects the table.

| | `layout='table'` (default) | `layout='tree'` |
| --- | --- | --- |
| Shape | A table that drills into nested objects and lists, with breadcrumbs | One tree with nested properties inline |
| Editing | Edit opens a draft; `onChange` reports edits before Save. Cancel can report a reset | Edits apply immediately; with `schema`, `onChange` reports the complete result |
| Typical use | Reviewing one object at a time before saving | Seeing and editing nested properties together inside a larger form |
| Extras | `allowRequired` and `allowKeyProperty` columns, `isPropertyProtected`, `validatePropertyName`, `header`, `footer` | Concepts, Generated toggle (`allowGeneratedProperty`), controlled mode, per-row slots, selection, read-only, `pt`. See [Tree layout](tree-layout.md) |

Props that belong to one layout are ignored by the other. [Extending the editor](extending.md) lists exactly which apply where.

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

The example starts in table view mode. Choose Edit to change `name` or `age`; `onChange={setSchema}` keeps React state up to date, but does not store anything outside the application. Before adding persistence, read [Save and Cancel](editing.md#save-and-cancel): passing each change back as `schema` also refreshes the table's cancellation baseline.

## Basic Schema Structure

An object schema puts named fields in `properties`. Its `required` array names fields that must be present in that same object:

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

SchemaEditor and [ObjectContentEditor](../ObjectContentEditor/index.md) share the `JsonSchema` and `JsonSchemaProperty` types from `@cratis/components/types`. These describe an authoring subset of JSON Schema, not a general-purpose validator. The contract declares `title`, `name`, `$id`, `$ref`, `type`, `format`, `description`, `properties`, `items`, `required` and `definitions`. Carrying a keyword does not mean the editor offers a control for it or validates its meaning.

The table offers `string`, `integer`, `number`, `boolean`, `object` and `array`. Its built-in `DEFAULT_TYPE_FORMATS` catalog adds `guid`, `date-time`, `date` and `time` for strings; `int16`, `int32` and `int64` for integers; and `float` and `double` for numbers. See [Types and Formats](types-formats.md) to configure the table's catalog.

The tree has its own type menu: text, number, boolean, date, time, unique identifier, object, and lists of text, numbers or objects. It also supports domain concepts. It does not use the table's `typeFormats` catalog; see [Tree layout](tree-layout.md).

Neither layout offers controls to author or validate composition keywords such as `oneOf`, value constraints such as `enum`, or limits such as `minimum` and `minLength`. These keywords can survive edits without being understood by the editor. Type changes can remove constraints or nested structure that no longer apply. Boolean schemas (`true` or `false` in place of a schema object) are outside the supported shape.

Use your application's validator to check edited schemas and the data they describe. If you need to edit richer vocabulary, use a dedicated schema editor. [JSON Schema mapping](json-schema.md) explains what survives conversion and what changes when a property is retyped.

## Table Interface

In the default layout, each row shows a property of the current object:

| Property  | Type      |
| --------- | --------- |
| name      | string    |
| id        | guid      |
| age       | number    |
| createdAt | date-time |

The Type column shows the property's format when one is set, falling back to its JSON type otherwise. Pass `allowRequired` to add a Required column, or `allowKeyProperty` to add a Key column. Both are editable in edit mode. Continue with [Editing Properties](editing.md) to wire the table's changes and Save action into your application.

## See Also

- [Editing Properties](editing.md) - Add, modify, and remove properties
- [Types and Formats](types-formats.md) - Available types and format options
- [Validation](validation.md) - Validation rules and constraints
- [Tree layout](tree-layout.md) - The inline tree editor (`layout='tree'`)
- [Extending the editor](extending.md) - Slots, callbacks and which props apply to which layout
- [JSON Schema mapping](json-schema.md) - Vendor keyword preservation, `x-generated`, `x-concept`, `x-key` and the conversion helpers
