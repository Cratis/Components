---
title: ToggleSwitchField
description: Bind a boolean property on an Arc command to a labeled on/off switch.
---

`ToggleSwitchField` provides a Cratis-owned labeled on/off switch bound to a `boolean` property on a command. It is the switch-styled counterpart of [CheckboxField](./checkbox-field.md).

## Usage

The excerpt assumes `UpdateProfile` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { ToggleSwitchField } from '@cratis/components/CommandForm';

<CommandDialog<UpdateProfile>
    command={UpdateProfile}
    title='Notifications'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <ToggleSwitchField<UpdateProfile> value={c => c.notificationsEnabled} label="Enable notifications" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `label` | `string` | — | Text displayed next to the switch. It is the switch's accessible name — override it to localize. |
| `className` | `string` | — | Extra CSS class forwarded to the underlying `ToggleSwitch`. |
| `pt` | component-specific parts | — | Cratis-owned HTML attributes for stable parts. |
| `ptOptions` | `object` | — | Legacy compatibility prop; ignored. |
| `unstyled` | `boolean` | `false` | Legacy compatibility prop; ignored. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows `false` while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The switch is wrapped in a `<label>`, so the visible text is its accessible name and clicking the text toggles it.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
