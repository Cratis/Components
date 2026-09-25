---
title: InputTextField
description: Bind a string property on an Arc command to a native single-line input.
---

`InputTextField` renders a Cratis-owned native single-line input. It supports all standard HTML input types.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { InputTextField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit account'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <InputTextField<MyCommand> value={c => c.username} title="Username" placeholder="Enter username" />
    <InputTextField<MyCommand> value={c => c.email} title="Email" type="email" placeholder="name@example.invalid" />
    <InputTextField<MyCommand> value={c => c.password} title="Password" type="password" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `type` | `'text' \| 'email' \| 'password' \| 'color' \| 'date' \| 'datetime-local' \| 'time' \| 'url' \| 'tel' \| 'search'` | `'text'` | The HTML input type. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
