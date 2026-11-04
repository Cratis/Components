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

Bind a numeric member on the command owned by the surrounding dialog or Arc `CommandForm`. The accessor selects that member; it does not initialize it. This field edits numbers, not formatted currency or numeric strings.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `min` | `number` | — | Native input's minimum constraint. |
| `max` | `number` | — | Native input's maximum constraint. |
| `step` | `number` | — | Native input's increment/decrement step. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows `0` when the bound property is `undefined`, without writing that fallback to the command. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
- On an edit, writes the native input's `valueAsNumber`. If that is `NaN`, including when the input is cleared, it writes `0`, not `null`, `undefined`, or a numeric string.

The displayed fallback and an edit that writes zero are different states. If zero is an acceptable initial answer, seed it through `initialValues`; use `currentValues` for a changing parent-owned value. Otherwise a required command property can remain unset despite displaying zero. See [Initialize command values](../CommandDialog/index.md#initialize-command-values).

`min`, `max`, and `step` are native input constraints, not a clamping function or server validation rules. The field does not provide locale/currency parsing or a decimal-precision guarantee, and the browser can allow an out-of-range value to be typed. Enforce the business limits on the command/server too.

`pt.root` targets the wrapper; `pt.input` targets the native number input. Put input identity, `disabled`, or `readOnly` attributes on `pt.input`, not the wrapper. Blur is forwarded from the wrapper. Accessible naming and error descriptions follow the shared field rules above; the invalid attributes do not mean every client or server constraint has run. Disabled/read-only editing does not authorize a submitted value.
