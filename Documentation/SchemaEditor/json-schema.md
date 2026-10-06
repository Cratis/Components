---
title: JSON Schema mapping
description: How SchemaEditor reads and writes JSON Schema, the x-concept and x-key keywords, and what it does not preserve.
---

## JSON Schema support

SchemaEditor and [`ObjectContentEditor`](../ObjectContentEditor/index.md) share one `JsonSchema`/`JsonSchemaProperty` contract (`@cratis/components/SchemaEditor` also exports the types), and it is a **pragmatic authoring subset of JSON Schema, not a general-purpose validator**. The contract declares `title`, `name`, `$id`, `$ref`, `type`, `format`, `description`, `properties`, `items`, `required` and `definitions`.

SchemaEditor edits a narrower model than that contract: the **property tree**. It converts the schema into properties, edits them, and writes a new schema from them.

## Types

| Property type | JSON Schema written |
| --- | --- |
| Text | `{ "type": "string" }` |
| Number | `{ "type": "number" }` |
| Yes or no | `{ "type": "boolean" }` |
| Date | `{ "type": "string", "format": "date" }` |
| Time | `{ "type": "string", "format": "time" }` |
| List of text | `{ "type": "array", "items": { "type": "string" } }` |
| List of numbers | `{ "type": "array", "items": { "type": "number" } }` |
| Object | `{ "type": "object", "properties": { … } }` |
| List of objects | `{ "type": "array", "items": { "type": "object", "properties": { … } } }` |

Reading is more forgiving: `integer` reads as a number, and an unknown or missing `type` reads as text. A list whose items are not numbers or objects reads as a list of text.

## Keywords the editor adds

| Keyword | Where | Meaning |
| --- | --- | --- |
| `required` | The containing object, or the `items` of a list of objects | Names of the properties that must be present. Omitted when empty |
| `x-concept` | The property | The concept the property is typed as. The property still carries the primitive's `type` |
| `x-key` | The property | `true` on the property that identifies its object. At most one per object |

The keywords are exported as `CONCEPT_KEYWORD` and `KEY_KEYWORD`.

```json
{
    "type": "object",
    "properties": {
        "orderId": { "type": "string", "x-concept": "OrderId", "x-key": true },
        "total": { "type": "number" }
    },
    "required": ["total"]
}
```

## What is not preserved

The editor is not a lossless editor for arbitrary JSON Schema. Reading a schema and writing it back drops everything the property tree has no place for:

- `integer` becomes `number`, and formats other than `date` and `time` (`guid`, `date-time`, `int32`…) are dropped;
- `description`, `title`, `$id`, `$ref`, `definitions`, composition keywords (`oneOf`, `anyOf`, `allOf`, `not`), `enum`, `const`, numeric and string constraints, and `additionalProperties`;
- names in `required` that have no declared property.

Treat the output as authoritative only for the shape the editor supports, and validate it with the application's own validator. A host that must keep richer vocabulary should merge the output into its own document instead of replacing it.

## Converting without the editor

The conversion is pure, so a host can use it without rendering the editor:

```ts
import {
    jsonSchemaToProperties,
    propertiesToJsonSchema,
    setKeyProperty,
    setRequiredProperty,
} from '@cratis/components/SchemaEditor';

const properties = jsonSchemaToProperties(schema);
const next = setRequiredProperty(properties, properties[0].id, true);
const written = propertiesToJsonSchema(setKeyProperty(next, next[0].id));
```

| Function | Purpose |
| --- | --- |
| `jsonSchemaToProperties`, `propertiesToJsonSchema` | Convert in each direction. Ids are generated on every read |
| `addProperty`, `addChildProperty`, `removeProperty`, `renameProperty`, `changePropertyType` | Immutable edits of the tree |
| `setRequiredProperty`, `toggleRequiredProperty`, `setKeyProperty` | Requiredness and the key |
| `findPropertyById`, `findPropertyByName`, `findSiblingProperties`, `totalPropertyCount` | Tree queries |
| `conceptPropertyName`, `uniquePropertyName`, `findPropertyNameProblem` | Naming |

Property ids belong to one editing session. Persist names, and use `findPropertyByName` to rebind state kept by name to a freshly converted tree.
