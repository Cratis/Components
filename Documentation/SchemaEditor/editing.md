---
title: SchemaEditor table editing and persistence
description: Edit properties in SchemaEditor's table layout, enable Required and Key controls, and handle Save, Cancel, and persistence in your application.
---

SchemaEditor's table layout lets users edit properties in a local draft and reports each structural change through `onChange` before Save. Use `onSave` to start your application's persistence workflow; neither Save nor Cancel sends data to a server.

This guide covers `layout='table'`, the default. The [tree layout](tree-layout.md) applies edits inline and has no built-in Save or Cancel actions.

## Enter edit mode

Choose Edit in the SchemaEditor toolbar to start changing properties. Left/Right and Home/End move between actions, and Tab still reaches each one. `editMode` sets the initial mode; it is not a controlled edit-mode value. To prevent entry through Edit, set `canEdit={false}` and leave the initial mode read-only.

When `canEdit` is false, the Edit action is still shown but does nothing. Set `canNotEditReason` to render it as a disabled action (`aria-disabled`) with a tooltip that explains why editing is unavailable; without a reason, the action looks enabled.

## Add a property

Choose Add Property while editing. SchemaEditor creates a string property named `newProperty`, or tries `newProperty1`, `newProperty2` and so on until the name is unique among its siblings.

Rename the new row and choose its type or format. Built-in validation accepts the generated name; your own `validatePropertyName` callback can impose further rules. Save stays disabled while the editor reports name or schema-shape errors.

```tsx
<SchemaEditor
    schema={schema}
    editMode
    onChange={setSchema}
    onSave={() => persist(schema)}
/>
```

This excerpt assumes `const [schema, setSchema] = useState<JsonSchema>(...)` as in the [overview](index.md#quick-start), and your own `persist` function. Each edit updates that state; Save calls `persist` with the latest value. Passing the value back as `schema` also refreshes the cancellation baseline, so this wiring alone does not provide discard-all-changes behavior. See [Save and Cancel](#save-and-cancel) before relying on it.

## Rename a property

Type a new name in the Name input. Accepted changes update the draft and emit `onChange`. Names must be non-empty, unique among siblings, and match the identifier pattern documented in [Validation](validation.md#property-name-validation). Reserved prototype keys are also rejected.

Invalid names in the draft, including an empty name, receive an accessible invalid state and keep Save disabled. Duplicate sibling names and reserved prototype keys leave the existing name unchanged. Renaming a required property also updates the matching entry in that object's `required` array.

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

For arrays, a second control chooses the item type. Changing it replaces the `items` schema, so existing item properties and metadata are not retained. Object item schemas can be opened and edited through the same nested navigation.

Retyping a property can also drop constraints that no longer apply, such as string limits when moving to a number. Read [JSON Schema mapping](json-schema.md#changing-a-property-type) before using the table to edit schemas with constraints the controls do not display.

## Navigate nested schemas

Open an object property or an array of objects to edit its nested fields. In view mode, click the row; in edit mode, use its navigation button. The breadcrumb shows the current path and lets you return to an ancestor.

Each nested object has its own `properties` and `required` list. Requiring `address.city`, for example, does not make `address` required in the parent object.

## Required properties

Pass `allowRequired` to show a Required column. Its checkboxes add or remove names in the current object's `required` list while in edit mode. You can also supply required names in the incoming schema, as below; they are preserved even when the column is hidden.

SchemaEditor keeps required names consistent while editing:

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
                city: { type: 'string' },
            },
            required: ['city'],
        },
    },
    required: ['name'],
};
```

Pass `allowKeyProperty` to show a Key column. Selecting a key writes `x-key: true` on that property and clears it from its siblings; selecting the current key clears it. This annotation identifies a property within its object, but does not validate the uniqueness of data values.

## Remove a property

Use the row's delete action. Removal changes the draft immediately and emits `onChange`; SchemaEditor does not show a confirmation dialog. A removed required property is also removed from the current object's `required` array.

Use `isPropertyProtected` to prevent specific properties from being renamed or removed. When deletion needs approval, put that review in the host's persistence workflow.

## Save and Cancel

Save invokes `onSave` and leaves edit mode. It is disabled while property-name or schema-shape errors exist. The editor does not await asynchronous persistence, so your application must show pending state, handle failures, and decide how to retry.

Cancel restores the editor's baseline snapshot and leaves edit mode. If the draft differs from that snapshot, it emits the restored schema through `onChange` with `{ source: 'reset' }`, then invokes `onCancel`. With no changes, it calls `onCancel` without emitting a reset.

Choosing Edit captures the current draft as the baseline. A new valid `schema` prop replaces both the draft and that baseline, even during editing. This includes echoing every `onChange` value back through `schema`, as the example above does: Cancel then restores the latest supplied value, not necessarily the value from before Edit.

For a Save/Cancel form that must discard all unsaved edits, keep the saved schema separate from the latest draft. Capture `onChange` values for Save without feeding each edit back into the table's `schema` prop. If the host does replace `schema` during editing, it must retain and restore its own snapshot for discard behavior. Filter on change metadata when needed so a `'reset'` is not treated as a new user edit.

`saveDisabled` and `cancelDisabled` hide their corresponding actions. They do not disable persistence elsewhere in the host.

## Host-owned history and batch operations

The table layout does not expose undo/redo, row selection, or batch operations. A host can store successive `onChange` values to provide history, or transform the schema before passing a replacement value back. Remember that a replacement also becomes the table's cancellation baseline.

The [tree layout](tree-layout.md) offers host-owned row selection, but neither layout provides built-in history or batch editing.

## Read-only use

Set `canEdit={false}` and leave `editMode` unset or false to keep the schema browsable. The Edit action remains visible but cannot start editing:

```tsx
<SchemaEditor schema={schema} canEdit={false} canNotEditReason='Published schemas are read-only' />
```

Nested object/array navigation and descriptions remain available for review. Add, delete, type, format, Save, and Cancel actions are unavailable.
