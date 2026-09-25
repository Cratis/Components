---
title: PasswordField
description: Bind a string property on an Arc command to a masked input with a show/hide toggle.
---

`PasswordField` provides a Cratis-owned masked text input with a labeled show/hide action.

## Usage

The excerpt assumes `SetPassword` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { PasswordField } from '@cratis/components/CommandForm';

<CommandDialog<SetPassword>
    command={SetPassword}
    title='Set password'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <PasswordField<SetPassword> value={c => c.password} title="Password" placeholder="At least 8 characters" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `showLabel` | `string` | `'Show password'` | Accessible name of the toggle while the value is masked. Override to localize. |
| `hideLabel` | `string` | `'Hide password'` | Accessible name of the toggle while the value is visible. Override to localize. |
| `className` | `string` | — | Extra CSS class combined with the default `w-full`. |
| `pt` | component-specific parts | — | Cratis-owned HTML attributes for stable parts. |
| `ptOptions` | `object` | — | Legacy compatibility prop; ignored. |
| `unstyled` | `boolean` | `false` | Legacy compatibility prop; ignored. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The input masks its content. A toggle button next to it shows or hides the value; its accessible name switches between `showLabel` and `hideLabel`.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
