# SchemaEditor

The `SchemaEditor` component provides an interactive table-based interface for creating and editing JSON schemas.

## Purpose

SchemaEditor allows users to define data structures by adding properties, specifying types, and configuring validation rules in a user-friendly table format.

## Key Features

- Interactive property editing
- Type selection from JSON schema types
- Format specification for common patterns
- Required/optional property flags
- Array and object type support
- Inline editing with validation
- Add/remove properties
- Read-only mode support

## Quick Start

```typescript
import { SchemaEditor } from '@cratis/components';
import { JsonSchema } from '@cratis/components/types';

function MySchemaEditor() {
    const [schema, setSchema] = useState<JsonSchema>({
        type: 'object',
        properties: {
            name: { type: 'string' },
            age: { type: 'number' }
        },
        required: ['name']
    });

    return (
        <SchemaEditor
            schema={schema}
            onChange={setSchema}
        />
    );
}
```

## Basic Schema Structure

The component works with JSON schemas following the JSON Schema specification:

```typescript
{
    type: 'object',
    properties: {
        propertyName: {
            type: 'string' | 'number' | 'boolean' | 'object' | 'array',
            format?: 'date' | 'time' | 'date-time' | 'email' | 'uri' | 'uuid' | ...,
            // ... other validation rules
        }
    },
    required: ['propertyName']
}
```

## Table Interface

Properties are displayed in a table:

| Name | Type | Format | Required |
|------|------|--------|----------|
| name | string | - | ✓ |
| email | string | email | ✓ |
| age | number | - |  |
| createdAt | string | date-time |  |

## See Also

- [Editing Properties](editing.md) - Add, modify, and remove properties
- [Types and Formats](types-formats.md) - Available types and format options
- [Validation](validation.md) - Validation rules and constraints
