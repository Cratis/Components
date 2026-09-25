---
title: TextAreaField
description: Bind a string property on an Arc command to a native multi-line input.
---

`TextAreaField` renders a Cratis-owned native multi-line input.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { TextAreaField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit description'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <TextAreaField<MyCommand> value={c => c.description} title="Description" placeholder="Enter a description" rows={4} />
    <TextAreaField<MyCommand> value={c => c.notes} title="Notes" rows={3} />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `rows` | `number` | `5` | Number of visible text rows. |
| `cols` | `number` | — | Number of visible text columns. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
