# ObjectContentEditor

The `ObjectContentEditor` component displays and allows exploration of complex JSON objects with schema-aware rendering and navigation.

## Purpose

ObjectContentEditor provides a structured view of JSON objects with breadcrumb navigation for exploring nested objects and arrays, rendering properties according to a JSON schema.

## Key Features

- Schema-aware property display
- Breadcrumb navigation for nested objects
- Type-specific rendering (strings, numbers, booleans, dates, etc.)
- Format-aware display (email, URI, UUID, etc.)
- Array and object exploration
- Timestamp display for temporal data
- Icon-based type indicators
- Read-only viewing mode

## Quick Start

```typescript
import { ObjectContentEditor } from '@cratis/components';
import { JsonSchema } from '@cratis/components/types';

function MyObjectViewer() {
    const data = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        profile: {
            age: 30,
            city: 'Oslo'
        }
    };

    const schema: JsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
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

    return (
        <ObjectContentEditor
            object={data}
            schema={schema}
        />
    );
}
```

## Props

### Required Props

- `object`: The JSON object to display
- `schema`: JSON schema defining the object's structure

### Optional Props

- `timestamp`: Date to display as a snapshot timestamp
- `editMode`: When `true`, renders editable input fields for each property (default: `false`)
- `onChange`: Called with the full updated object after any field edit — only relevant when `editMode` is `true`
- `onValidationChange`: Called with `true` when any field has a validation error, `false` when all fields are valid — only called when `editMode` is `true`

## Edit Mode

When `editMode` is `true`, each property is rendered as an editable input field appropriate for its schema type and format.

### Input field types

| Schema type / format | Input rendered |
|---|---|
| `boolean` | Checkbox |
| `number` / `integer` | Number input |
| `string` / `date-time` | Date + time picker |
| `string` / `date` | Date picker |
| `string` (> 50 chars) | Textarea |
| `string` (any other) | Text input |
| `array` | Read-only (not yet editable) |
| `object` | Read-only (not yet editable) |

### Validation

Validation runs on every field change and whenever `object` or `schema` changes.

- **In edit mode**: all fields are required — any empty value is flagged.
- **In view mode**: only fields listed in `schema.required` are validated.
- `string` fields with `format: 'email'` are validated against a basic email pattern.
- `string` fields with `format: 'uri'` must start with `http://` or `https://`.
- `number` / `integer` fields must be valid numbers.

Validation errors are displayed inline beneath each field using PrimeReact's `p-error` style.

### Edit Mode Example

```typescript
import { ObjectContentEditor } from '@cratis/components';
import { useState } from 'react';

function EditableProduct() {
    const schema = {
        type: 'object',
        required: ['name', 'price'],
        properties: {
            name: { type: 'string' },
            price: { type: 'number' },
            inStock: { type: 'boolean' },
            releaseDate: { type: 'string', format: 'date-time' },
            website: { type: 'string', format: 'uri' }
        }
    };

    const [product, setProduct] = useState({
        name: 'Laptop Pro',
        price: 1299.99,
        inStock: true,
        releaseDate: '2024-01-15T10:00:00Z',
        website: 'https://example.com'
    });

    const [hasErrors, setHasErrors] = useState(false);

    return (
        <>
            <ObjectContentEditor
                object={product}
                schema={schema}
                editMode
                onChange={setProduct}
                onValidationChange={setHasErrors}
            />
            <button disabled={hasErrors}>Save</button>
        </>
    );
}
```

## Navigation

### Breadcrumb Trail

The ObjectNavigationalBar shows current location:

```text
Root > profile > address > city
```

- Click "Root" to return to top level
- Click any segment to jump to that level
- Click back arrow to go up one level

### Nested Objects

Click any object or array property to navigate into it:

```typescript
// Top level
{
    name: "Product A",
    metadata: { ... }  // Click to view
}

// After clicking metadata
{
    created: "2024-01-01",
    tags: ["sale", "featured"]
}
```

### Navigation Examples

```typescript
// Navigate to nested object
profile → address → city

// Navigate into array
tags → [0] → view first tag

// Return to parent
Click back arrow or breadcrumb
```

## Complete Example

```typescript
import { ObjectContentEditor } from '@cratis/components';

function ProductViewer() {
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
        website: 'https://example.com/laptop-pro',
        releaseDate: '2024-01-15T10:00:00Z'
    };

    const schema = {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
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

1. **Provide complete schema**: Define all properties for proper rendering
2. **Use appropriate formats**: Leverage format hints for better display
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
- `properties` defining each property's type and format
- Optional `required` array for required properties
- Nested schemas for object and array types

## Performance Considerations

- Large objects (1000+ properties) may render slowly
- Deep nesting (5+ levels) can be difficult to navigate
- Consider pagination or virtualization for large arrays
- Schema validation on every render can impact performance
