# PasswordField

`PasswordField` provides a masked text entry backed by the PrimeReact `InputPassword` component, bound to a `string` property on a command.

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
| `pt` | `InputPasswordProps['pt']` | — | PrimeReact pass-through configuration for the underlying `InputPassword`. |
| `ptOptions` | `InputPasswordProps['ptOptions']` | — | PrimeReact pass-through options. |
| `unstyled` | `boolean` | `false` | Disables every base PrimeReact style on the underlying `InputPassword`. |

## Behavior

- Default value is an empty string.
- The input masks its content; the underlying `InputPassword` provides the show/hide affordance.
- Validation state is reflected via the PrimeReact `invalid` flag.
