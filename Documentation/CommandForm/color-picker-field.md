---
title: ColorPickerField
description: Bind a hex color string on an Arc command to a native color input.
---

`ColorPickerField` renders a Cratis-owned native color input.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { ColorPickerField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit theme'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <ColorPickerField<MyCommand>
        value={c => c.primaryColor}
        title="Primary color"
    />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | - | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `inline` | `boolean` | `false` | Adds `data-inline` to the root part for your own CSS. The native color input always opens the browser's picker, and no built-in style uses the attribute. |
| `defaultColor` | `string` | `000000` | Fallback color used when the bound value is empty. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- Values are persisted as six-digit hex strings without the leading `#`.
- Validation state is exposed through `aria-invalid` on the native color input and `data-invalid` on the stable root part.
