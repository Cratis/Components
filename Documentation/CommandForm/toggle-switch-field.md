# ToggleSwitchField

`ToggleSwitchField` provides an on/off switch backed by the PrimeReact `ToggleSwitch` component, bound to a `boolean` property on a command. It is the switch-styled counterpart of [CheckboxField](./checkbox-field.md).

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { ToggleSwitchField } from '@cratis/components/CommandForm';

<CommandDialog command={UpdateProfile} visible={visible} onCancel={() => setVisible(false)}>
    <ToggleSwitchField<UpdateProfile> value={c => c.notificationsEnabled} label="Enable notifications" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `label` | `string` | — | Text displayed next to the switch. It is the switch's accessible name — override it to localize. |
| `className` | `string` | — | Extra CSS class forwarded to the underlying `ToggleSwitch`. |
| `pt` | `ToggleSwitchRootProps['pt']` | — | PrimeReact pass-through configuration. |
| `ptOptions` | `ToggleSwitchRootProps['ptOptions']` | — | PrimeReact pass-through options. |
| `unstyled` | `boolean` | `false` | Disables every base PrimeReact style on the underlying `ToggleSwitch`. |

## Behavior

- Default value is `false`.
- The switch is wrapped in a `<label>`, so the visible text is its accessible name and clicking the text toggles it.
- Validation state is reflected via the PrimeReact `invalid` flag.
