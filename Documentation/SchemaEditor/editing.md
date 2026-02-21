# SchemaEditor - Editing Properties

## Adding Properties

Click the "Add Property" button or row to create a new property:

```typescript
<SchemaEditor
    schema={schema}
    onChange={(newSchema) => {
        console.log('Property added:', newSchema);
        setSchema(newSchema);
    }}
/>
```

New properties default to:

- Name: empty (must be filled)
- Type: `string`
- Format: none
- Required: `false`

## Editing Property Name

Click the name cell to edit:

1. Click the cell
2. Enter the property name
3. Press Enter or click outside to save
4. Press Escape to cancel

Property names must:

- Be unique within the schema
- Follow JavaScript identifier rules (alphanumeric, underscores)
- Not be empty

Invalid names show an error indicator.

## Changing Property Type

Use the type dropdown to select:

- `string` - Text values
- `number` - Numeric values (integers and decimals)
- `integer` - Whole numbers only
- `boolean` - True/false values
- `object` - Nested objects
- `array` - Lists of items
- `null` - Null values

```typescript
// Example schema with various types
{
    type: 'object',
    properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        price: { type: 'number' },
        active: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' }
    }
}
```

## Setting Format

For `string` types, select a format to provide hints about expected value patterns:

### Date and Time Formats

- `date` - Full date (2024-01-15)
- `time` - Time of day (14:30:00)
- `date-time` - Combined date and time (2024-01-15T14:30:00Z)

### Identifier Formats

- `uuid` - UUID/GUID strings
- `uri` - URIs and URLs
- `email` - Email addresses
- `hostname` - DNS hostnames
- `ipv4` / `ipv6` - IP addresses

### Other Formats

- `json-pointer` - JSON pointer references
- `regex` - Regular expression patterns

```typescript
{
    type: 'object',
    properties: {
        email: { type: 'string', format: 'email' },
        website: { type: 'string', format: 'uri' },
        userId: { type: 'string', format: 'uuid' },
        birthDate: { type: 'string', format: 'date' }
    }
}
```

## Toggling Required

Click the checkbox in the Required column to mark a property as required or optional.

Required properties:

- Must be present in valid data
- Are listed in the schema's `required` array
- Show a checkmark in the table

```typescript
{
    type: 'object',
    properties: {
        name: { type: 'string' },
        email: { type: 'string' }
    },
    required: ['name', 'email']  // Both are required
}
```

## Removing Properties

Click the delete button (trash icon) on any row to remove that property.

A confirmation may appear for:

- Properties marked as required
- Properties with nested schemas
- Properties used in dependencies

## Inline Validation

The editor validates input as you type:

- **Name conflicts**: Red highlight if name already exists
- **Invalid characters**: Warning for non-identifier characters
- **Empty names**: Error indicator
- **Type mismatches**: Format options only for compatible types

## Keyboard Shortcuts

- `Enter` - Save current cell edit
- `Escape` - Cancel current cell edit
- `Tab` - Move to next cell
- `Shift+Tab` - Move to previous cell
- `Delete` (on row) - Remove property

## Undo/Redo

(If implemented) Use undo/redo to revert changes:

```typescript
const [schema, setSchema] = useState(initialSchema);
const [history, setHistory] = useState([initialSchema]);
const [historyIndex, setHistoryIndex] = useState(0);

const handleUndo = () => {
    if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        setSchema(history[historyIndex - 1]);
    }
};

const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        setHistoryIndex(historyIndex + 1);
        setSchema(history[historyIndex + 1]);
    }
};
```

## Batch Operations

Select multiple properties for batch operations:

- Change type for all selected
- Mark all as required/optional
- Delete multiple properties
- Apply format to all

## Read-Only Mode

Disable editing to display schema structure without allowing changes:

```typescript
<SchemaEditor
    schema={schema}
    onChange={setSchema}
    readOnly={true}
/>
```

In read-only mode:

- No add/delete buttons
- Cells are not editable
- Displays current schema structure
- Useful for schema review or documentation
