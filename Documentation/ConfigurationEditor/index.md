---
title: Configuration editors
description: Reusable controls for configuring a component, with the host deciding what may change.
---

The configuration editors are the controls a screen editor needs when it lets a person configure a component: an [ordered item editor](ordered-item-editor.md) for collections such as navigation entries, generic [property controls](property-controls.md) driven by descriptors, and a [registry](component-editors.md) that lets a component bring its own editor.

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

The controls render, validate entries and emit proposals. They never decide policy.

| The controls | The host |
|---|---|
| Render the values and the controls for exactly the capabilities they receive. | Decides the capabilities: which operations and which fields are allowed, and why a restriction exists. |
| Validate an entry before proposing it and show the message. | Supplies extra validation rules and server-side feedback, and owns authoritative permission checks. |
| Emit a **proposal** through `onChange`. | Applies the proposal by passing new values, or ignores it to cancel. |
| List destinations and show the icon picker over the catalog the host supplies. | Supplies the destinations and the icon catalog. Nothing here navigates, discovers an application hierarchy or resolves an icon library package. |
| Show locked items in text and in accessible state. | Resolves templates: which items are inherited, and what a locked item means. |
| Carry stable item identities through every proposal. | Creates the identity of a new item and persists the result. |

Every control is controlled. Nothing changes on screen until the host passes new values, so the host stays in charge of undo, cancellation and persistence. A restricted operation is both not offered and never emitted: a control that was somehow triggered anyway still produces no proposal.

## Locked and configurable state

Fixed (inherited) items are listed in their own section, with the text **Locked**, a dashed border and no controls. The difference never depends on opacity, so the configuration controls stay fully readable when the host dims the component's own preview. Restricted fields appear as text, and the reason the host gives is printed next to them.

## Examples use synthetic data

The Storybook examples use an independent "Example Project" with a fixed **Home** item and configurable **Page A** and **Page B** items. One host allows every operation; another restricts icon editing and the collection operations.
