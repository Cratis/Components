---
title: JSON Schema mapping
description: Vendor and standard keywords, type changes, generated values, the conversion helpers, and the limits of the tree layout.
---

## JSON Schema support

SchemaEditor and [`ObjectContentEditor`](../ObjectContentEditor/index.md) share one `JsonSchema`/`JsonSchemaProperty` contract (`@cratis/components/SchemaEditor` also exports the types), and it is a **pragmatic authoring subset of JSON Schema, not a general-purpose validator**. The contract declares `title`, `name`, `$id`, `$ref`, `type`, `format`, `description`, `properties`, `items`, `required` and `definitions`.

The table layout edits the schema document in place and keeps every keyword it does not show. The tree layout (`layout='tree'`) edits a narrower model, the **property tree**: it converts the schema into properties, edits them, and writes a new schema from them.

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

Reading is more forgiving: `integer` reads as a number, and an unknown or missing `type` reads as text. A list whose items are not numbers or objects reads as a list of text. The table above is what the editor writes for a property you create or retype; a property you leave alone is written back as it was read.

## Keywords the editor adds

The tree layout reads and writes these keywords. The table layout offers controls only for `required` and `x-key`, when `allowRequired` or `allowKeyProperty` enables the matching column; it preserves `x-concept` and `x-generated` without editing them.

| Keyword | Where | Meaning |
| --- | --- | --- |
| `required` | The containing object, or the `items` of a list of objects | Names of the properties that must be present. Omitted when empty |
| `x-concept` | The property | The concept the property is typed as. The property still carries the primitive's `type` |
| `x-key` | The property | `true` on the property that identifies its object. At most one per object |
| `x-generated` | The property | `true` when the value is created when the command runs rather than entered. The tree's opt-in Generated toggle sets or clears it |

The keywords are exported as `CONCEPT_KEYWORD`, `KEY_KEYWORD` and `GENERATED_KEYWORD`. The Generated toggle is tree-only; the table preserves the keyword without offering a column.

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

## What the tree layout preserves

Unknown `x-` vendor keywords round-trip verbatim on every property node, including nested object properties, array properties and array `items` nodes. Strings, numbers, booleans, nulls, objects and arrays keep their values. `Property.vendorKeywords` carries property annotations, and `Property.itemVendorKeywords` carries item annotations; empty maps are omitted. Rename, required and key edits keep this metadata. A type change keeps property annotations but clears item annotations when the item kind changes, including a change to a non-array type.

Standard keywords the editor does not model round-trip as well, on a property and on the `items` node of a list: annotations (`title`, `description`, `$comment`, `deprecated`, `readOnly`, `writeOnly`), value keywords (`default`, `enum`, `const`, `examples`), string, number, list and object constraints (`minLength`, `pattern`, `minimum`, `minItems`, `additionalProperties`…), and anything else such as `$ref`, `oneOf` or `if`. `Property.schemaKeywords` and `Property.itemSchemaKeywords` carry them like the vendor keyword maps do, and are omitted when empty. A host that owns the tree in [controlled mode](extending.md#controlled-mode) keeps them on the properties it stores and passes them back unchanged.

The editor models the property type as text, number, yes or no, date, time, object or list, so it keeps where a property came from while its type is unchanged: `integer`, a type array such as `["string", "null"]`, a node without a `type`, and a `format` other than `date` and `time` are written back exactly as read. Choosing a different type discards that detail along with the keywords that no longer apply. The table layout leaves the whole node in place and applies the same rules when you choose a different type.

`x-generated: true` reads as `Property.isGenerated`. Any other `x-generated` value stays verbatim in `vendorKeywords` until an explicit Generated edit replaces or clears it. `x-concept` and `x-key` retain their dedicated mapping.

The tree editor also preserves every root key except `type`, `properties` and `required`, which it rebuilds. This keeps root vendor keywords, `title`, `definitions` and other root metadata. When using conversion helpers directly, pass the incoming schema as the second argument to `propertiesToJsonSchema(properties, schema)` for the same behavior. Unedited round trips preserve the order of supported root, property and item keywords as well as their values.

## Changing a property type

A type change keeps only what still applies to the new type. Choosing the type a property already has, for example typing a number as a concept, keeps everything.

| Keywords | After a type change |
| --- | --- |
| Annotations: `title`, `description`, `$comment`, `deprecated`, `readOnly`, `writeOnly` | Kept |
| Vendor `x-` keywords, `required` and `x-key` | Kept as described above; `required` follows the children |
| Text constraints: `minLength`, `maxLength`, `pattern`, `contentEncoding`, `contentMediaType` | Kept when the new type is text, date or time |
| Number constraints: `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf` | Kept when the new type is a number |
| List constraints: `minItems`, `maxItems`, `uniqueItems`, `contains`, `minContains`, `maxContains` | Kept when the new type is a list of any kind; keywords on the items are dropped |
| Object constraints: `minProperties`, `maxProperties`, `additionalProperties`, `patternProperties`, `propertyNames`, `dependentRequired`, `dependentSchemas`, `unevaluatedProperties` | Kept when the new type is an object |
| Value keywords: `default`, `enum`, `const`, `examples` | Dropped |
| Type refinements: `integer`, type arrays, and a `format` other than the date and time the editor writes | Dropped |
| Anything else, such as `$ref`, `allOf`, `oneOf`, `anyOf`, `not`, `if`, `then`, `else` | Dropped |

## What the tree layout does not preserve

The tree layout is not a lossless editor for arbitrary JSON Schema. It drops the following:

- names in `required` that have no declared property;
- the keywords listed above when you change a property's type, and `properties` and `items` that no longer fit the type.

Treat the output as authoritative only for the shape the editor supports, and validate it with the application's own validator.

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
const written = propertiesToJsonSchema(setKeyProperty(next, next[0].id), schema);
```

| Function | Purpose |
| --- | --- |
| `jsonSchemaToProperties`, `propertiesToJsonSchema` | Convert in each direction. Ids are generated on every read |
| `addProperty`, `addChildProperty`, `removeProperty`, `renameProperty`, `changePropertyType` | Immutable edits of the tree |
| `setRequiredProperty`, `toggleRequiredProperty`, `setKeyProperty`, `setGeneratedProperty` | Requiredness, the key and generated values |
| `findPropertyById`, `findPropertyByName`, `findSiblingProperties`, `totalPropertyCount` | Tree queries |
| `conceptPropertyName`, `uniquePropertyName`, `findPropertyNameProblem` | Naming |

Property ids belong to one editing session. Persist names, and use `findPropertyByName` to rebind state kept by name to a freshly converted tree.
