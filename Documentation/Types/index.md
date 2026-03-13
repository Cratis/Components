# Types

The `Types` module exports shared TypeScript types and constants used across the component library. Import from `@cratis/components/types`.

## JsonSchema

Describes the shape of a JSON Schema object used by `ObjectContentEditor`, `SchemaEditor`, and related components.

```typescript
import { JsonSchema, JsonSchemaProperty } from '@cratis/components/types';

const schema: JsonSchema = {
    type: 'object',
    required: ['name'],
    properties: {
        name: { type: 'string', description: 'Full name' },
        age: { type: 'integer' },
        email: { type: 'string', format: 'email' }
    }
};
```

### JsonSchema properties

| Property | Type | Description |
|---|---|---|
| `title` | `string` | Human-readable title |
| `name` | `string` | Schema name |
| `$id` | `string` | Schema identifier |
| `$ref` | `string` | Reference to another schema |
| `type` | `string` | JSON type (`object`, `array`, `string`, `number`, `integer`, `boolean`) |
| `format` | `string` | Format hint (e.g. `date-time`, `email`, `uri`, `uuid`) |
| `description` | `string` | Property description — displayed as a tooltip |
| `properties` | `Record<string, JsonSchemaProperty>` | Object properties |
| `items` | `JsonSchema` | Schema for array items |
| `required` | `string[]` | Names of required properties |
| `definitions` | `Record<string, JsonSchema>` | Reusable sub-schemas |

### JsonSchemaProperty properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Property identifier |
| `name` | `string` | Property name |
| `type` | `string` | JSON type |
| `format` | `string` | Format hint |
| `description` | `string` | Description shown as tooltip |
| `items` | `JsonSchema` | Schema for array items |
| `properties` | `Record<string, JsonSchemaProperty>` | Nested properties |
| `required` | `boolean` | Whether the property is required |
| `$ref` | `string` | Reference to another schema |

## Json

A recursive type representing any valid JSON value.

```typescript
import { Json } from '@cratis/components/types';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
```

Use `Json` for the `object` prop on `ObjectContentEditor` and for `onChange` callbacks.

## TypeFormat

Represents a JSON type and format pair. Used to describe the type/format combinations that a schema editor or form field supports.

```typescript
import { TypeFormat, DEFAULT_TYPE_FORMATS } from '@cratis/components/types';
```

### DEFAULT_TYPE_FORMATS

A pre-defined list of common type/format combinations:

| `jsonType` | `format` |
|---|---|
| `string` | _(none)_ |
| `string` | `guid` |
| `string` | `date-time` |
| `string` | `date` |
| `string` | `time` |
| `integer` | _(none)_ |
| `integer` | `int16` |
| `integer` | `int32` |
| `integer` | `int64` |
| `number` | _(none)_ |
| `number` | `float` |

## NavigationItem

Represents a single step in a breadcrumb navigation path.

```typescript
import { NavigationItem } from '@cratis/components/types';

interface NavigationItem {
    name: string;
    path: string[];
}
```

Used internally by `ObjectNavigationalBar`.

