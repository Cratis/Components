# SchemaEditor - Types and Formats

## JSON Schema Types

### String

Text data of any length.

```typescript
{
    type: 'string'
}
```

**Use for**: Names, descriptions, text fields, IDs

**Common formats**:

- `date`, `time`, `date-time` - Temporal data
- `email` - Email addresses
- `uri` - URLs and URIs
- `uuid` - Unique identifiers

### Number

Numeric values, including decimals.

```typescript
{
    type: 'number'
}
```

**Use for**: Prices, measurements, percentages, coordinates

**Validation options**:

- `minimum` / `maximum` - Range constraints
- `multipleOf` - Must be multiple of value

```typescript
{
    type: 'number',
    minimum: 0,
    maximum: 100,
    multipleOf: 0.01  // Two decimal places
}
```

### Integer

Whole numbers only, no decimals.

```typescript
{
    type: 'integer'
}
```

**Use for**: Counts, quantities, IDs, ages, years

**Validation options**: Same as `number`

```typescript
{
    type: 'integer',
    minimum: 0,
    maximum: 150
}
```

### Boolean

True or false values.

```typescript
{
    type: 'boolean'
}
```

**Use for**: Flags, toggles, yes/no questions

### Object

Nested objects with their own properties.

```typescript
{
    type: 'object',
    properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zipCode: { type: 'string' }
    },
    required: ['street', 'city']
}
```

**Use for**: Complex structured data, nested entities

**Additional options**:

- `properties` - Define nested properties
- `required` - List of required property names
- `additionalProperties` - Allow/disallow extra properties

### Array

Lists of items, all of the same type.

```typescript
{
    type: 'array',
    items: { type: 'string' }
}
```

**Use for**: Lists, collections, tags, multiple selections

**Validation options**:

- `items` - Schema for array elements
- `minItems` / `maxItems` - Length constraints
- `uniqueItems` - Require unique elements

```typescript
{
    type: 'array',
    items: { type: 'string', format: 'email' },
    minItems: 1,
    maxItems: 5,
    uniqueItems: true
}
```

### Null

Explicit null values.

```typescript
{
    type: 'null'
}
```

**Use for**: Optional fields that can be explicitly null

Often combined with other types:

```typescript
{
    type: ['string', 'null']  // Can be string or null
}
```

## String Formats

### Date and Time

#### date

Full date in ISO 8601 format: `YYYY-MM-DD`

```typescript
{ type: 'string', format: 'date' }
// Example: "2024-01-15"
```

#### time

Time of day: `HH:MM:SS` or `HH:MM:SS.sss`

```typescript
{ type: 'string', format: 'time' }
// Example: "14:30:00"
```

#### date-time

Combined date and time with timezone: ISO 8601

```typescript
{ type: 'string', format: 'date-time' }
// Example: "2024-01-15T14:30:00Z"
```

### Identifiers

#### email

Email address format

```typescript
{ type: 'string', format: 'email' }
// Example: "user@example.com"
```

#### uuid

UUID/GUID identifier

```typescript
{ type: 'string', format: 'uuid' }
// Example: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
```

#### uri

Uniform Resource Identifier

```typescript
{ type: 'string', format: 'uri' }
// Example: "https://example.com/path"
```

#### hostname

DNS hostname

```typescript
{ type: 'string', format: 'hostname' }
// Example: "www.example.com"
```

### Network

#### ipv4

IPv4 address

```typescript
{ type: 'string', format: 'ipv4' }
// Example: "192.168.1.1"
```

#### ipv6

IPv6 address

```typescript
{ type: 'string', format: 'ipv6' }
// Example: "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
```

### Other

#### json-pointer

JSON Pointer reference

```typescript
{ type: 'string', format: 'json-pointer' }
// Example: "/path/to/property"
```

#### regex

Regular expression pattern

```typescript
{ type: 'string', format: 'regex' }
// Example: "^[a-zA-Z0-9]+$"
```

## Format Selection Logic

In SchemaEditor:

1. **Type = string**: All formats available
2. **Type = number/integer**: No formats (formats are for strings)
3. **Type = boolean/null**: No formats
4. **Type = object/array**: No formats (structure defines validation)

## Custom Formats

Extend with custom format validators:

```typescript
const customFormats = {
    'phone': /^\+?[1-9]\d{1,14}$/,
    'postal-code': /^[A-Z0-9]{3,10}$/,
    'credit-card': /^\d{13,19}$/
};
```

Register custom formats with your JSON schema validator library.

## Type Recommendations

| Data | Recommended Type | Format |
|------|-----------------|--------|
| Person name | string | - |
| Email address | string | email |
| Birth date | string | date |
| Created timestamp | string | date-time |
| User ID | string | uuid |
| Age | integer | - |
| Price | number | - |
| Quantity | integer | - |
| Is active | boolean | - |
| Tags | array of string | - |
| Address | object | - |
| Settings | object | - |
| Phone number | string | custom: phone |

## Migration Between Types

When changing a property's type in SchemaEditor:

- **string → number**: Existing string values must be numeric
- **number → integer**: Decimals will be truncated
- **any → array**: Wraps value in array
- **any → object**: Creates object with original value
- **array/object → primitive**: May lose data

Always validate data after type changes.
