---
title: NumberField
description: Bind a number property on an Arc command to a native numeric input.
---

`NumberField` renders a Cratis-owned native numeric input with optional constraints.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { NumberField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit order'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <NumberField<MyCommand> value={c => c.quantity} title="Quantity" min={1} max={100} />
    <NumberField<MyCommand> value={c => c.price} title="Price" min={0} step={0.01} placeholder="0.00" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `min` | `number` | — | Minimum allowed value. |
| `max` | `number` | — | Maximum allowed value. |
| `step` | `number` | — | Increment/decrement step size. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows `0` while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
- When the value is cleared, it falls back to `0`.
