# SchemaEditor - Validation

## Property Name Validation

### Rules

Property names must:

1. **Be unique** within the schema
2. **Not be empty**
3. **Follow identifier conventions** (recommended but not enforced)
   - Start with letter or underscore
   - Contain only letters, numbers, underscores
   - Avoid JavaScript reserved words

### Uniqueness Check

```typescript
// ✅ Valid - unique names
{
    properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' }
    }
}

// ❌ Invalid - duplicate names
{
    properties: {
        name: { type: 'string' },
        name: { type: 'number' }  // Error: duplicate
    }
}
```

### Visual Feedback

- **Green checkmark**: Valid, unique name
- **Red highlight**: Duplicate or invalid name
- **Tooltip**: Error message explaining issue

## Type Validation

### Type Compatibility

Ensure selected type matches intended data:

```typescript
// ✅ Compatible
{
    age: { type: 'integer' },
    price: { type: 'number' },
    name: { type: 'string' }
}

// ⚠️ Type mismatch (functional but semantic issue)
{
    age: { type: 'string' },      // Should be integer
    isActive: { type: 'string' }  // Should be boolean
}
```

### Format-Type Compatibility

Formats only apply to string types:

```typescript
// ✅ Valid
{
    email: { type: 'string', format: 'email' }
}

// ❌ Invalid - format ignored
{
    count: { type: 'integer', format: 'email' }  // Format has no effect
}
```

SchemaEditor automatically:

- Clears format when changing from string to another type
- Enables format dropdown only for string types

## Required Field Validation

### Required Array

The `required` array lists properties that must be present:

```typescript
{
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' }
    },
    required: ['name', 'email']  // name and email are required
}
```

### Validation Rules

1. **Required properties must exist** in `properties`
2. **Cannot remove required property** without unmarking as required first
3. **Renaming a required property** updates the `required` array

```typescript
// Before rename
required: ['oldName']

// After renaming 'oldName' to 'newName'
required: ['newName']  // Automatically updated
```

## Schema Structure Validation

### Object Type Requirements

Objects should have `properties` defined:

```typescript
// ✅ Well-defined object
{
    type: 'object',
    properties: {
        id: { type: 'string' },
        value: { type: 'number' }
    }
}

// ⚠️ Empty object (valid but not useful)
{
    type: 'object',
    properties: {}
}
```

### Array Type Requirements

Arrays should have `items` schema defined:

```typescript
// ✅ Well-defined array
{
    type: 'array',
    items: { type: 'string' }
}

// ⚠️ Missing items schema
{
    type: 'array'
    // What type are the items?
}
```

SchemaEditor may:

- Prompt for items schema when creating array type
- Default to `{ type: 'string' }` for items
- Show warning for array without items definition

## Constraint Validation

### Numeric Constraints

For `number` and `integer` types:

```typescript
{
    age: {
        type: 'integer',
        minimum: 0,
        maximum: 150
    },
    price: {
        type: 'number',
        minimum: 0,
        multipleOf: 0.01  // Two decimal places
    }
}
```

Validation checks:

- `minimum` ≤ `maximum`
- `multipleOf` > 0
- `exclusiveMinimum` < `exclusiveMaximum`

### String Constraints

For `string` type:

```typescript
{
    username: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9_]+$'
    }
}
```

Validation checks:

- `minLength` ≥ 0
- `maxLength` ≥ `minLength`
- `pattern` is valid regex

### Array Constraints

For `array` type:

```typescript
{
    tags: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10,
        uniqueItems: true
    }
}
```

Validation checks:

- `minItems` ≥ 0
- `maxItems` ≥ `minItems`
- `items` schema is valid

## Real-Time Validation

As you edit, SchemaEditor validates:

1. **On property name change**
   - Check uniqueness
   - Update required array if needed

2. **On type change**
   - Clear incompatible format
   - Remove incompatible constraints
   - Prompt for type-specific requirements

3. **On format change**
   - Verify format is valid for type
   - Show format examples

4. **On required toggle**
   - Add/remove from required array
   - Update visual indicators

## Validation Messages

Types of validation feedback:

### Error (Red)

Prevents saving, must be fixed:

- Duplicate property name
- Empty property name
- Invalid schema structure

### Warning (Yellow)

Can save but may cause issues:

- Property name with special characters
- Missing items schema for array
- No properties defined for object

### Info (Blue)

Helpful suggestions:

- Recommended format for data type
- Common patterns for validation
- Best practices

## External Validation

Validate generated schema against JSON Schema spec:

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();

const isValidSchema = ajv.validateSchema(schema);

if (!isValidSchema) {
    console.error('Schema validation errors:', ajv.errors);
}
```

## Validation Best Practices

1. **Use required sparingly**: Only mark truly required fields
2. **Choose appropriate types**: Match data semantics
3. **Add constraints**: Use min/max, patterns for data quality
4. **Test with data**: Validate real data against schema
5. **Document expectations**: Use descriptions for complex rules
6. **Version schemas**: Track changes over time
7. **Validate early**: Catch errors during editing, not at runtime
