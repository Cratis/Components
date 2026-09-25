---
title: CheckboxField
description: Bind a boolean property on an Arc command to a native checkbox.
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

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `label` | `string` | — | Text displayed inline next to the checkbox. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows `false` while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- Validation state is reflected through `aria-invalid` and `data-invalid`.
