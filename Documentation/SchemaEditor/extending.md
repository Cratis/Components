---
title: Extending the editor
description: Controlled mode, slots and callbacks that attach product features such as rules and mapping connectors to SchemaEditor.
---

SchemaEditor owns the shape of a schema and nothing else. A product that needs more — validation rules per property, connectors to map properties onto something, its own header and chrome — attaches it through generic extension points rather than through options that only one product would use.

## Design decision

Rules, mapping and artifact chrome stay in the product. Components does not define a rule model, operators, drag-and-drop connectors, or a card header, because those vocabularies differ between products. The editor instead gives the host the three things it needs to build them:

1. **Somewhere to render** on every row: before the name, at the end of the row, and under it.
2. **The row's identity and place**: the property, its depth, its siblings, and the whole tree, so a slot can resolve any property.
3. **A way to describe the row**: extra classes, `data-*` attributes, a tooltip, and whether the type is locked.

State that belongs to the host — rules, mapped properties — is kept by the host, keyed by property name because ids are not stable across sessions. `onPropertyRenamed` and `onPropertyRemoved` let it keep that state in step.

## Extension points

| Point | Use it for |
| --- | --- |
| `header` | A title, a validation summary, the connector of the root |
| `footer` | Actions beside **Add property** |
| `renderPropertyLeading(property, context)` | Content before the name, such as a connector to drag from or onto |
| `renderPropertyAccessory(property, context)` | Controls at the end of the row, before the remove button, such as an **Add rule** button |
| `renderPropertyDetails(property, context)` | Content under the row, above its nested properties, such as the rules of that property. Nothing is rendered for `undefined`, `null` and `false` |
| `getPropertyRowState(property, context)` | `className`, `attributes` (`data-*`), `title`, and `lockType` for the row |
| `selectedPropertyId`, `onPropertyClick` | Selection owned by the host |
| `isPropertyProtected`, `validatePropertyName` | Restrictions and extra name checks |
| `onPropertiesChange`, `onPropertyRemoved`, `onPropertyRenamed` | Notifications of edits the editor owns |

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

`Connector` registers its element with the host's drawing code in an effect, which replaces the mount and unmount callbacks of a prop-based design with ordinary React lifecycle. `lockType` keeps a mapped property from changing type under its mapping.

## Controlled mode

Pass `properties` to own the tree. The editor then changes nothing itself: it shows what you pass and offers an edit only when you supply its callback.

| Callback | Edit |
| --- | --- |
| `onAddProperty(type, concept?)` | Add to the root |
| `onAddChildProperty(parentId, type, concept?)` | Add to a nested object |
| `onDeleteProperty(propertyId)` | Remove |
| `onRenameProperty(propertyId, name)` | Rename; the name is already checked |
| `onChangePropertyType(propertyId, type, concept?)` | Change the type |
| `onSetKeyProperty(propertyId)` | Set or clear the key |
| `onSetRequiredProperty(propertyId, isRequired)` | Set requiredness |

Apply each callback with the pure functions the package exports (`addChildProperty`, `removeProperty`…), or with your own logic when an edit has side effects, such as removing the mappings of a deleted property.

`onChange`, `onPropertiesChange`, `onPropertyRemoved` and `onPropertyRenamed` apply only when the editor owns the tree.

## Overlay-free by design

The editor renders only its own tree. Placing it in a dialog, a dock or a card is the host's job; the type menu stacks above the nearest `Dialog` on its own.
