---
title: Register component editors in Cratis Components
description: Register component-specific editors in Cratis Components, supply a generic fallback, and keep permission checks and saving in your application.
---

Register a component-specific editor in Cratis Components when generic property inputs do not fit the settings people need to change. `ConfigurationEditorProvider` maps your application's component type names to editor functions. `ConfigurationEditor` renders the matching editor or a fallback you supply; without either, it renders nothing.

For navigation settings, the example below registers an `OrderedItemEditor` under `navigation`. Other component types use the `PropertyControls` supplied as the fallback. Your application is the host: it supplies the selected component, its current configuration, and the rules for editing it.

```tsx
import {
    ConfigurationEditor,
    ConfigurationEditorProvider,
    OrderedItemEditor,
    PropertyControls,
} from '@cratis/components/ConfigurationEditor';

const editors = {
    navigation: ({ value, onChange, readOnly, context }) => (
        <OrderedItemEditor
            aria-label='Navigation'
            items={value.items}
            capabilities={readOnly ? lockedDown : context.capabilities}
            onChange={(proposal) => onChange({ ...value, items: [...proposal.items] })}
        />
    ),
};

<ConfigurationEditorProvider editors={editors}>
    <ConfigurationEditor
        componentType={selected.type}
        value={selected.configuration}
        onChange={saveConfiguration}
        context={{ capabilities }}
        fallback={
            <PropertyControls
                aria-label='Settings'
                groups={groupsFor(selected.type)}
                values={selected.configuration}
                onChange={(proposal) => saveConfiguration(proposal.values)}
            />
        }
    />
</ConfigurationEditorProvider>
```

Here `lockedDown`, `selected`, `saveConfiguration` and `groupsFor` stand for your own data and functions. The registry has no built-in component types: `selected.type` must match the `navigation` key to select that editor.

The navigation editor receives `selected.configuration` as `value`. When its ordered items change, it proposes a replacement configuration that keeps the other fields and replaces `items`. `saveConfiguration` receives that proposal; the host decides whether to accept it and passes the accepted configuration back as a new `value`. The callback's name does not make saving automatic.

The fallback is explicit in this example. For any unregistered type, `groupsFor(selected.type)` supplies the property descriptors and `PropertyControls` proposes updated values. You can also supply a `fallback` function. That function and registered editors receive the same editor props, including `context`, which is passed through unchanged for data such as capabilities, destinations, or an icon catalog.

A nested `ConfigurationEditorProvider` adds to its parent's editors and overrides registrations with the same name. If your host needs to render an editor itself, `useConfigurationEditor(componentType)` returns the registered function, or `undefined` when no editor is registered.

## Component-provided editors versus host-owned policy

A component-provided editor understands its configuration shape, but the host decides which settings a person may change. If your application uses templates, it determines which items are inherited and which fields each template exposes. It also decides how that configuration becomes a screen; the registry does not supply a layout engine.

Pass editing restrictions to the editor through `readOnly` and any capabilities in `context`. `ConfigurationEditor` forwards these props; it does not enforce them or block `onChange`. Registered editors and fallback functions must respect them, and a fallback supplied as a React node must be configured by the host directly. The host must check every proposal before applying or saving it, with authoritative permission checks at the application's write boundary.

## Binding and persistence

The configuration controls do not persist changes. Keep the configuration in host-owned state, apply or reject each proposal, and decide when and where to save. Accepting a proposal into local state and writing it to storage are separate decisions, so your application can support cancellation or undo before saving.

For the navigation editor's item shape, restrictions, and change proposals, continue with the [ordered item editor guide](ordered-item-editor.md). To define the generic fallback, use the [property controls reference](property-controls.md).
