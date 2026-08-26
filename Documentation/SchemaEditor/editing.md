# SchemaEditor - Editing Properties

SchemaEditor is controlled: it emits each structural change through `onChange`, and the host decides when and where to persist the resulting schema. Save and Cancel are workflow actions around that controlled value; they do not perform transport themselves.

## Enter edit mode

Use the Edit action in the SchemaEditor toolbar. Set `editMode` to choose the initial mode, or set `canEdit={false}` to prevent editing.

When `canEdit` is false, `canNotEditReason` can explain why the Edit action is unavailable.

## Add a property

Choose **Add Property** while editing. SchemaEditor creates a unique sibling name:

- `newProperty`
- `newProperty1` when `newProperty` already exists
- then the next available numeric suffix

The property starts as `{ type: 'string' }`. Rename it and choose its type or format in the table. The generated name is valid immediately; Save is disabled only when a later edit makes a name invalid.

```tsx
<SchemaEditor
    schema={schema}
    editMode
    onChange={setSchema}
    onSave={() => persist(schema)}
/>
```

## Rename a property

The Name input updates the controlled schema as you type. Names must be non-empty, unique among siblings, and match the identifier pattern documented in [Validation](validation.md#property-name-validation).

Invalid names receive an accessible invalid state and keep Save disabled. Renaming a required property also updates the matching entry in that object's `required` array.

## Change type and format

The Type control combines JSON types and configured formats. The maintained defaults include:

- `string`, `guid`, `date-time`, `date`, and `time`
- `integer`, `int16`, `int32`, and `int64`
- `number`, `float`, and `double`
- `boolean`
- container types `object` and `array`

Pass `typeFormats` to replace the maintained leaf type/format list. `object` and `array` remain available as container types.

Changing type intentionally normalizes the supported structure:

- `array` receives string `items` by default.
- `object` receives empty `properties`.
- Moving to a leaf removes stale nested `items`, `properties`, and nested required names.
- Choosing a type without a format removes the previous format.

For arrays, a second control chooses the item type. Object item schemas can be opened and edited through the same nested navigation.

## Navigate nested schemas

Object properties and object-valued array items expose navigation actions. The breadcrumb shows the current path and lets you return to any ancestor.

Each nested object is edited in its own scope. Its `properties` and `required` array are independent of the parent object's arrays.

## Required properties

SchemaEditor does not currently render a Required column or an interactive required/optional toggle. Set required names in the schema before rendering, or transform the controlled schema in host code.

SchemaEditor keeps existing required names consistent while editing:

- Renaming a required property renames its required entry.
- Deleting a required property removes its required entry.
- Replacing nested object structure removes stale nested required names.

```typescript
const schema = {
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
};
```

## Remove a property

Use the row's delete action. Removal is immediate and emits the updated schema through `onChange`; SchemaEditor does not show a confirmation dialog. A removed required property is also removed from the current object's `required` array.

Add confirmation in the host before allowing edit mode, or wrap persistence in the product's own review workflow when removal needs domain-specific approval.

## Save and Cancel

- **Save** invokes `onSave` and leaves edit mode. It is disabled while property-name or schema-shape errors exist.
- **Cancel** restores the snapshot captured when edit mode began, emits that restored value through `onChange`, invokes `onCancel`, and leaves edit mode.
- `saveDisabled` and `cancelDisabled` hide the corresponding actions when the host owns those decisions elsewhere.

Because `onChange` is emitted during editing, keep the latest controlled value in state. If persistence is asynchronous, perform it in `onSave` using that state.

## Host-owned history and batch operations

SchemaEditor does not include undo/redo, row selection, or batch operations. A host can store successive `onChange` values to provide history, or transform the schema before passing a replacement value back.

Do not infer batch or history behavior from the underlying table component; SchemaEditor exposes only the actions documented here.

## Read-only use

Set `canEdit={false}` to keep the schema browsable without exposing editing actions:

```tsx
<SchemaEditor
    schema={schema}
    canEdit={false}
/>
```

Nested object/array navigation and descriptions remain available for review. Add, delete, type, format, Save, and Cancel actions are unavailable.
