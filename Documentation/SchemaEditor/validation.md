# SchemaEditor - Validation

SchemaEditor validates the subset it actively edits. It prevents malformed schema structure and invalid property names from being saved, but it is not a general-purpose JSON Schema validator.

## Supported structural validation

Before SchemaEditor copies an incoming schema into editable state, it verifies that:

- The root schema is a JSON object.
- `properties` and `definitions`, when present, are objects whose values are valid schema objects.
- `items`, when present, is a valid schema object.
- `required`, when present, is an array of strings.
- The complete structure can round-trip through JSON without circular references, `BigInt`, or other non-JSON values.

A malformed schema does not crash the editor. SchemaEditor shows its localized invalid-schema message as an alert and disables Edit, Save, and Add Property until a valid `schema` prop is supplied. Supplying valid data clears the error and resynchronizes the editor.

Boolean schemas (`true` or `false` in place of a schema object), tuple-valued `items`, and other shapes outside the declared `JsonSchema` contract are not supported.

## Property name validation

Property names must:

1. Not be empty or whitespace-only.
2. Start with a letter or underscore.
3. Contain only letters, numbers, and underscores.
4. Be unique among siblings in the current object schema.

```typescript
// Valid sibling names
{
    properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' }
    }
}
```

SchemaEditor validates names while you edit. An invalid input receives `aria-invalid` and `data-invalid`, its tooltip explains the error, and Save remains disabled. Clearing a name is therefore an error rather than a way to bypass validation.

JSON itself cannot represent duplicate keys in one object. The uniqueness rule applies while a property is renamed toward the name of an existing sibling.

## Required-property consistency

Each object schema owns its own `required` array:

```typescript
{
    type: 'object',
    properties: {
        name: { type: 'string' },
        address: {
            type: 'object',
            properties: {
                city: { type: 'string' }
            },
            required: ['city']
        }
    },
    required: ['name']
}
```

SchemaEditor preserves required semantics while properties are edited:

- Renaming a required property updates the matching name in that object's `required` array.
- Deleting a required property removes the stale required entry.
- Nested required arrays remain scoped to their own nested object.
- Replacing an object's type or property set removes required names that no longer describe that property.

SchemaEditor does not currently provide a Required column or an interactive required/optional toggle. Set initial required names in the schema, or transform the schema in application code. See [Editing Properties](editing.md#required-properties).

## Type and format normalization

When a property's type changes, SchemaEditor keeps the supported shape internally consistent:

- `array` starts with `items: { type: 'string' }` and removes an incompatible format.
- `object` starts with empty `properties` and removes stale `items`, format, and nested required names.
- A leaf type removes stale `items`, `properties`, and nested required names.
- Selecting no format removes the existing `format` value.

Available format options come from the configured `TypeFormat[]`. The maintained defaults are documented in [Types and formats](types-formats.md).

## What SchemaEditor does not validate

SchemaEditor does not validate JSON Schema keywords it does not edit, including:

- Composition keywords such as `oneOf`, `anyOf`, `allOf`, and `not`.
- `enum` and `const`.
- Numeric/string/array constraints such as `minimum`, `pattern`, or `minItems`.
- `additionalProperties`, `patternProperties`, dependencies, and conditional schemas.
- Whether external `$ref` targets resolve.
- Whether instance data conforms to the authored schema.

Unknown fields are generally preserved by clone-and-spread updates, but targeted type changes can make richer external constraints obsolete. Validate the result with the application's authoritative JSON Schema tooling when those keywords matter.

## External validation

For example, an application using Ajv can validate the resulting schema before persistence:

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();
const valid = ajv.validateSchema(schema);

if (!valid) {
    console.error('Schema validation errors:', ajv.errors);
}
```

Choose the validator and JSON Schema draft that the application actually supports; Components does not impose either one.
