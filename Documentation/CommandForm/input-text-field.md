---
title: InputTextField
description: Bind a string property on an Arc command to a native single-line input.
---

`InputTextField` renders a Cratis-owned native single-line input. Its `type` prop accepts the input types listed below, not every HTML input type.

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

The accessor `value={c => c.username}` selects a string member on the command owned by the surrounding dialog or Arc `CommandForm`; it is not a literal input value or an initializer. Each edit writes the native input's string value unchanged. Choosing `email`, `date`, or another supported input type changes the browser control, not the command value's type. Use [CalendarField](calendar-field.md) for a `Date`-valued property.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `type` | `'text' \| 'email' \| 'password' \| 'color' \| 'date' \| 'datetime-local' \| 'time' \| 'url' \| 'tel' \| 'search'` | `'text'` | The HTML input type. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string when the bound property is `undefined`; this fallback does not replace `null` or write a command value. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.

A placeholder is only a hint. If an initial empty string is an acceptable answer, supply it explicitly through `initialValues`; use `currentValues` when the parent keeps changing the value. See [Initialize command values](../CommandDialog/index.md#initialize-command-values). Field `initialValue` and `noInitialValue` control query/source population; `noInitialValue` does not block those explicit form values.

`pt.root` targets this field's native input, including its `disabled` and `readOnly` attributes. The field supplies its own value and change handler after those attributes, so pass-through is not an alternative binding mechanism. Disabling editing does not remove the command property or authorize its value on the server.

`title` supplies the default accessible name; explicit naming and error descriptions follow the shared accessibility rules linked above. The invalid attributes reflect Arc's error state, not a guarantee that a native input constraint or server validation has passed. For example, `type='email'` alone does not define a server email rule.
