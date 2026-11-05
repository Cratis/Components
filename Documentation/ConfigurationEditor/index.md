---
title: Configure components with Cratis Components
description: Cratis Components provides controls for editing component settings while your application owns layout, permission checks, and saving.
---

Cratis Components provides configuration controls for editing component settings in your own application. Your application, called the host, supplies the current values and decides which changes to accept. It also owns screen layout, permission checks, and saving.

Use the [ordered item editor](ordered-item-editor.md) for collections such as navigation entries. For individual settings, [property controls](property-controls.md) turn host-supplied descriptors into labeled inputs. When a component needs its own editing interface, [register a component-specific editor](component-editors.md) under the type name your application uses.

```tsx
import {
    OrderedItemEditor,
    PropertyControls,
    ConfigurationEditor,
    ConfigurationEditorProvider,
} from '@cratis/components/ConfigurationEditor';
```

Import the stylesheet once, either the aggregate `@cratis/components/styles` or the area sheet `@cratis/components/ConfigurationEditor/styles`, which includes the icon picker's rules.

## What the controls own, and what the host owns

`OrderedItemEditor` and `PropertyControls` render settings and propose changes through `onChange`. They check entries and respect the editing restrictions you supply, but your application must enforce its own authorization rules. `ConfigurationEditor` chooses a registered editor or the fallback you provide; it does not build a screen from the resulting configuration.

| The controls | The host |
|---|---|
| Render the values and the controls for exactly the capabilities they receive. | Decides the capabilities: which operations and which fields are allowed, and why a restriction exists. |
| Validate an entry before proposing it and show the message. | Supplies extra validation rules and server-side feedback, and owns authoritative permission checks. |
| Emit a **proposal** through `onChange`. | Applies the proposal by passing new values, or ignores it to cancel. |
| List destinations and show the icon picker over the catalog the host supplies. | Supplies the destinations and the icon catalog. Nothing here navigates, discovers an application hierarchy or resolves an icon library package. |
| Show locked items in text and in accessible state. | Resolves templates: which items are inherited, and what a locked item means. |
| Carry stable item identities through every proposal. | Creates the identity of a new item and persists the result. |

These editors are controlled: a proposal asks the host to replace the configuration. Accept it by passing updated values back, or ignore it to leave the configuration unchanged. This lets your application manage undo and cancellation before saving. The built-in controls do not offer restricted operations, and their change handlers also check those restrictions before emitting a proposal.

## Locked and configurable state

In `OrderedItemEditor`, pass inherited items as `fixedItems` to list them in a separate section with the text **Locked**, a dashed border, and no editing controls. Locking does not depend on opacity, so you can dim the component's preview separately without dimming its configuration controls. Read-only fields appear as text with the restriction reason you supply; hidden fields are omitted.

## Examples use synthetic data

The Storybook examples use synthetic "Example Project" data: a fixed **Home** item and configurable **Page A** and **Page B** items. One host allows every operation; another prevents adding or removing items and makes icons read-only while still allowing reordering.

To build the same kind of settings panel, follow the [ordered item editor guide](ordered-item-editor.md). For a panel of individual settings instead, start with the [property controls example](property-controls.md).
