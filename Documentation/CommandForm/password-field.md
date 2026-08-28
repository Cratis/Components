# PasswordField

`PasswordField` provides a Cratis-owned masked text input with a labeled show/hide action.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { PasswordField } from '@cratis/components/CommandForm';

<CommandDialog command={SetPassword} visible={visible} onCancel={() => setVisible(false)}>
    <PasswordField<SetPassword> value={c => c.password} placeholder="At least 8 characters" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `className` | `string` | — | Extra CSS class combined with the default `w-full`. |
| `pt` | component-specific parts | — | Cratis-owned HTML attributes for stable parts. |
| `ptOptions` | `object` | — | Legacy compatibility prop; ignored. |
| `unstyled` | `boolean` | `false` | Legacy compatibility prop; ignored. |

## Behavior

- Default value is an empty string.
- The input masks its content; the underlying `InputPassword` provides the show/hide affordance.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
