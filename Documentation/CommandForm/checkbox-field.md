---
title: CheckboxField
description: CheckboxField in Cratis Components binds an Arc command's boolean property to a native checkbox with an inline label and validation state.
---

`CheckboxField` provides a Cratis-owned native boolean checkbox.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { CheckboxField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit settings'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <CheckboxField<MyCommand> value={c => c.isActive} label="Active" />
    <CheckboxField<MyCommand> value={c => c.newsletter} label="Send me newsletter updates" />
</CommandDialog>
```

Bind a boolean member on the command owned by the surrounding dialog or Arc `CommandForm`. Each change writes the native checkbox's `checked` boolean. This is not a parser for the strings `'true'` and `'false'`, or a nullable three-state control.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `label` | `string` | — | Text displayed inline next to the checkbox. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Appears unchecked when the bound property is `undefined`, using a `false` display fallback without initializing the command. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- Validation state is reflected through `aria-invalid` and `data-invalid`.

An unchecked display can therefore mean either an explicit `false` or an unset property. If false is an acceptable initial answer, seed it through `initialValues`; use `currentValues` for a changing parent-owned value. See [Initialize command values](../CommandDialog/index.md#initialize-command-values). A required boolean must have a value, but that does not mean it must be `true`. A consent rule requiring true needs its own command/server validation.

`title` is Arc's field title; `label` is the text beside the checkbox. For the control's accessible name, an explicit `aria-label` takes precedence; otherwise the inline `label` is preferred over `title`. Error descriptions follow the shared field rules above.

`pt.root` targets the wrapping label. `pt.input` targets the native checkbox, including its `disabled` attribute; `pt.box` and `pt.indicator` style its visual state. The field does not implement read-only checkbox interaction, so `readOnly` is not an editing lock. A disabled or hidden checkbox does not remove the command member, establish consent, or authorize a submitted value.
