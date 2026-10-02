---
title: Component-specific editors
description: Let a component bring its own configuration editor, with generic controls as the fallback.
---

Not every component fits a flat list of properties. A navigation component is configured with an ordered item editor, a chart with something else. `ConfigurationEditorProvider` and `ConfigurationEditor` are the extension seam: the host registers a specialised editor under the component type names it already uses, and everything else falls back to generic controls.

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

Here `lockedDown`, `selected`, `saveConfiguration` and `groupsFor` stand for your own data and functions.

- `componentType` is a string the host defines. The registry knows no component types.
- `value` is the host's own configuration shape, and `onChange` receives the host's own replacement. It is a proposal: apply it by passing a new `value`, or ignore it.
- `context` is passed untouched to the registered editor and to a `fallback` function, for capabilities, destinations or an icon catalog.
- A nested `ConfigurationEditorProvider` adds to its parent's editors and overrides those with the same name.
- `useConfigurationEditor(componentType)` returns the registered editor, for hosts that render it themselves.
- With no registered editor and no `fallback`, nothing is rendered.

## Component-provided editors versus host-owned policy

A component-provided editor knows how its own configuration is shaped and how to edit it. It does **not** know the host's template policy. Which items are inherited, which fields a given template exposes, who may add pages, how a change is persisted and how a template resolves into a screen are all the host's. The host expresses its policy by passing capabilities and values in, and enforces it by deciding which proposals to apply. An editor that ignores the capabilities is still harmless, because the host is the authority on every proposal it receives.

## Binding and persistence

None of these controls persists anything. The value is bound by the host: it owns the configuration object, applies or rejects each proposal, and decides when and where to save. That also keeps undo, cancellation and focus handling in one place, because the controls only ever render the values they are given.
