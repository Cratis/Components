---
title: Extending the editor
description: Controlled mode, slots and callbacks that attach product features such as rules and mapping connectors to the tree layout of SchemaEditor.
---

Everything on this page is a prop of `SchemaEditor` and, unless the table says otherwise, applies to `layout='tree'`. The table layout honors only the entries marked *both layouts*; the others are ignored there.

SchemaEditor owns the shape of a schema and nothing else. A product that needs more — validation rules per property, connectors to map properties onto something, its own header and chrome — attaches it through generic extension points rather than through options that only one product would use.

## Design decision

Rules, mapping and artifact chrome stay in the product. Components does not define a rule model, operators, drag-and-drop connectors, or a card header, because those vocabularies differ between products. The editor instead gives the host the three things it needs to build them:

1. **Somewhere to render** on every row: before the name, at the end of the row, and under it.
2. **The row's identity and place**: the property, its depth, its siblings, and the whole tree, so a slot can resolve any property.
3. **A way to describe the row**: extra classes, `data-*` attributes, a tooltip, and whether the type is locked.

State that belongs to the host — rules, mapped properties — is kept by the host, keyed by property name because ids are not stable across sessions. `onPropertyRenamed` and `onPropertyRemoved` let it keep that state in step.

## Extension points

| Point | Layouts | Use it for |
| --- | --- | --- |
| `header` | both | A title, a validation summary, the connector of the root. It renders inside the editor's root, so a host that needs a full-bleed card header places its own header outside the editor |
| `footer` | both | Actions beside **Add property** |
| `renderPropertyLeading(property, context)` | tree | Content before the name, such as a connector to drag from or onto |
| `renderPropertyAccessory(property, context)` | tree | Controls at the end of the row, before the remove button, such as an **Add rule** button |
| `renderPropertyDetails(property, context)` | tree | Content under the row, above its nested properties, such as the rules of that property. Nothing is rendered for `undefined`, `null` and `false` |
| `renderPropertyTypeBadge(property, context, defaultBadge)` | tree | Replace or wrap the type badge; return `defaultBadge` to keep it |
| `getPropertyRowState(property, context)` | tree | `className`, `attributes` (`data-*`), `title`, `lockType` and `lockTypeReason` for the row |
| `selectedPropertyId`, `onPropertyClick` | tree | Selection owned by the host |
| `isPropertyProtected`, `validatePropertyName` | both (`validatePropertyName` too) | Restrictions and extra name checks |
| `onPropertiesChange`, `onPropertyRemoved`, `onPropertyRenamed` | both for `onPropertyRemoved` and `onPropertyRenamed`; tree for `onPropertiesChange` | Notifications of edits the editor owns |

Every slot receives a `SchemaPropertyContext`:

| Field | Meaning |
| --- | --- |
| `depth` | `0` for a root property |
| `siblings` | The properties that share the parent, the property included |
| `properties` | The whole tree currently shown |
| `readOnly` | Whether the editor is read-only |

## Rules on properties

```tsx
const [rules, setRules] = useState<Rule[]>([]);

<SchemaEditor
    layout='tree'
    schema={schema}
    renderPropertyAccessory={property => (
        <button type="button" onClick={() => setRules([...rules, newRuleFor(property)])}>
            {`Add rule to ${property.name}`}
        </button>
    )}
    renderPropertyDetails={property => (
        <RuleRows rules={rules.filter(rule => rule.propertyName === property.name)} onChange={setRules} />
    )}
    onPropertyRenamed={(property, previousName) =>
        setRules(current => current.map(rule =>
            rule.propertyName === previousName ? { ...rule, propertyName: property.name } : rule))}
    onPropertyRemoved={property =>
        setRules(current => current.filter(rule => rule.propertyName !== property.name))}
/>
```

Rules are keyed by `propertyName`, so they survive the ids being regenerated when the schema is converted again. A rule editor that wants the editor's own required toggle hidden simply leaves `allowRequired` off.

## Mapping connectors

Mapping needs a DOM element per row to draw lines from or to, and to know which row is under a drag. Render the element yourself in the leading slot and describe the row:

```tsx
<SchemaEditor
    layout='tree'
    properties={properties}
    selectedPropertyId={selectedId}
    onPropertyClick={setSelectedId}
    renderPropertyLeading={property => (
        <Connector propertyId={property.id} isMapped={mapped.has(property.id)} />
    )}
    getPropertyRowState={property => ({
        attributes: { 'data-drop-target': canAcceptDrop(property) ? property.id : undefined },
        className: isDropTarget(property) ? 'is-drop-target' : undefined,
        lockType: mapped.has(property.id),
    })}
    header={<RootConnector />}
/>
```

`Connector` registers its element with the host's drawing code in an effect, which replaces the mount and unmount callbacks of a prop-based design with ordinary React lifecycle. `lockType` keeps a mapped property from changing type under its mapping. Add `lockTypeReason` to say why: it becomes the tooltip of the locked type badge and its accessible description (through `aria-describedby`).

## Restyling the type badge

Every type badge carries `data-property-type="<type>"` (and `data-cratis-part="badge"`), so a host can tint it per type with CSS alone:

```css
[data-cratis-part='badge'][data-property-type='number'] { color: var(--my-number-color); }
```

To change the markup, pass `renderPropertyTypeBadge`. It receives the property, the row context and the badge the editor would render, and may return it unchanged, wrap it, or return something else. Inside an editable row the result stays within the button that opens the type menu.

## Selecting a row from a control

A click on a button, input, label or link inside a row does not select the row, so the host's own controls do not trigger selection by accident. To opt a control in, put `data-schema-row-select` on it, or on any ancestor within the row. A click on it, or on anything inside it, calls `onPropertyClick` with the property's id:

```tsx
renderPropertyAccessory={() => <button type="button" data-schema-row-select>Select</button>}
```

## Controlled mode

Tree layout only. Pass `layout='tree'` and `properties` to own the tree. The editor then changes nothing itself: it shows what you pass and offers an edit only when you supply its callback.

| Callback | Edit |
| --- | --- |
| `onAddProperty(type, concept?)` | Add to the root |
| `onAddChildProperty(parentId, type, concept?)` | Add to a nested object |
| `onDeleteProperty(propertyId)` | Remove |
| `onRenameProperty(propertyId, name)` | Rename; the name is already checked |
| `onChangePropertyType(propertyId, type, concept?)` | Change the type |
| `onSetKeyProperty(propertyId)` | Set or clear the key |
| `onSetRequiredProperty(propertyId, isRequired)` | Set requiredness |

A toggle callback implies its allow flag. In controlled mode, supplying `onSetRequiredProperty` offers the required toggle as if `allowRequired` were set, and supplying `onSetKeyProperty` offers the key toggle as if `allowKeyProperty` were set. Set the flag to `false` explicitly to hide the toggle while keeping the callback. In owned mode the flags stay off by default, because the editor performs the edits itself.

Apply each callback with the pure functions `@cratis/components/SchemaEditor` exports (`addChildProperty`, `removeProperty`…), or with your own logic when an edit has side effects, such as removing the mappings of a deleted property.

`onChange`, `onPropertiesChange`, `onPropertyRemoved` and `onPropertyRenamed` apply only when the editor owns the tree.

## What the table layout honors

| Prop | In the table layout |
| --- | --- |
| `allowRequired`, `allowKeyProperty` | Add a Required and a Key column. Both are editable in edit mode and read-only otherwise; `allowKeyProperty` as a function enables the column for every row |
| `isPropertyProtected` | Locks the name input and hides the delete button of a protected property |
| `validatePropertyName` | Runs after the built-in name checks; a message marks the name invalid and disables Save |
| `onPropertyRenamed`, `onPropertyRemoved` | Called once the edit is applied to the editor's working copy |
| `header`, `footer` | Rendered above and below the editor |
| `labels` | The `keyColumn`, `requiredColumn`, `requiredProperty`, `keyProperty` and `protectedProperty` labels |

Everything else on this page — `concepts`, controlled mode, the per-row slots, selection, `pt`, `readOnly` — is ignored by the table layout. The table has its own Edit, Save and Cancel workflow and drills into nested objects instead of showing them inline.

## Overlay-free by design

The editor renders only its own tree. Placing it in a dialog, a dock or a card is the host's job; the type menu stacks above the nearest `Dialog` on its own.
