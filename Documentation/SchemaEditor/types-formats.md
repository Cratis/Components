# SchemaEditor - Types and formats

SchemaEditor authors a deliberate JSON Schema subset. It is not a complete JSON Schema validator or a general-purpose editor for every vocabulary keyword. The application remains responsible for validating stored data and any richer schema contract.

## Supported property types

The built-in editor offers six types:

| Type      | Purpose                                       | Nested definition           |
| --------- | --------------------------------------------- | --------------------------- |
| `string`  | Text and formatted temporal/identifier values | —                           |
| `integer` | Whole numeric values                          | —                           |
| `number`  | Floating-point or decimal values              | —                           |
| `boolean` | True/false values                             | —                           |
| `object`  | Named nested properties                       | `properties` and `required` |
| `array`   | Repeated values                               | `items`                     |

The editor does not offer `null`, boolean schemas, or type unions such as `type: ['string', 'null']`.

## Built-in formats

The default `TypeFormat` catalog is exported as `DEFAULT_TYPE_FORMATS` from `@cratis/components/types` and contains:

| JSON type | Formats                                          |
| --------- | ------------------------------------------------ |
| `string`  | unformatted, `guid`, `date-time`, `date`, `time` |
| `integer` | unformatted, `int16`, `int32`, `int64`           |
| `number`  | unformatted, `float`, `double`                   |
| `boolean` | unformatted                                      |

Example:

```ts
const schema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'guid' },
        occurred: { type: 'string', format: 'date-time' },
        count: { type: 'integer', format: 'int32' },
        score: { type: 'number', format: 'double' },
        active: { type: 'boolean' },
    },
};
```

`guid`, `int16`, `int32`, `int64`, `float`, and `double` are application/framework format conventions rather than standard JSON Schema validation keywords. A validator that consumes the schema must understand the formats it intends to enforce.

## Custom type-format catalogs

Pass `typeFormats` to replace the default primitive catalog:

```tsx
import type { TypeFormat } from '@cratis/components/types';

const typeFormats: TypeFormat[] = [
    { jsonType: 'string', format: '' },
    { jsonType: 'string', format: 'email' },
    { jsonType: 'string', format: 'uri' },
    { jsonType: 'integer', format: 'int32' },
    { jsonType: 'boolean', format: '' },
];

<SchemaEditor schema={schema} typeFormats={typeFormats} onChange={setSchema} />;
```

The selected option stores the `jsonType` in `type` and a non-empty format in `format`. `array` and `object` remain available in addition to the custom primitive catalog.

A custom format changes what SchemaEditor can author. It does not register a validator or define runtime semantics automatically.

## Objects

Object properties use recursive `properties` definitions and an optional `required` string array:

```ts
{
    type: 'object',
    properties: {
        street: { type: 'string' },
        city: { type: 'string' },
    },
    required: ['street', 'city'],
}
```

Use the navigation action in the type cell to edit an object's nested properties.

## Arrays

Arrays use one recursive `items` schema:

```ts
{
    type: 'array',
    items: {
        type: 'object',
        properties: {
            name: { type: 'string' },
        },
        required: ['name'],
    },
}
```

SchemaEditor does not author tuple arrays, `minItems`, `maxItems`, or `uniqueItems`.

## Unsupported keywords and round trips

Schema objects may arrive with keywords outside the supported subset, such as:

- `oneOf`, `anyOf`, `allOf`, and `not`;
- `enum` and `const`;
- `minimum`, `maximum`, and `multipleOf`;
- `minLength`, `maxLength`, and `pattern`;
- `additionalProperties` and `patternProperties`;
- `minItems`, `maxItems`, and `uniqueItems`.

SchemaEditor does not display or edit these keywords. Its mutation paths clone and spread the existing schema, so unrelated unknown properties are generally preserved while ignored. They are not validated by the editor.

Do not rely on blind preservation as a complete round-trip guarantee. A targeted type change intentionally rewrites structural fields such as `type`, `format`, `items`, or `properties`, and can make richer external constraints inconsistent with the new type. If an application owns a richer schema dialect, validate the result after every edit or maintain the richer contract in a dedicated schema editor.

## Type changes

Changing a type changes the schema definition, not the application's existing data. SchemaEditor does not convert stored values.

Applications should decide how to migrate data when changing, for example:

- `string` to `number`;
- `number` to `integer`;
- primitive to `array` or `object`;
- `object` or `array` to a primitive.

Run application/server validation before persisting a changed schema and before applying it to existing values.

## Related documentation

- [SchemaEditor overview](index.md)
- [Editing properties](editing.md)
- [Validation](validation.md)
- [Shared JSON and schema types](../Types/index.md)
