# CheckboxField

`CheckboxField` provides a boolean toggle backed by the PrimeReact `Checkbox` component.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { CheckboxField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <CheckboxField<MyCommand> value={c => c.isActive} label="Active" />
    <CheckboxField<MyCommand> value={c => c.newsletter} label="Send me newsletter updates" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `label` | `string` | — | Text displayed inline next to the checkbox. |

## Behavior

- Default value is `false`.
- Validation state is reflected via the PrimeReact `invalid` flag on the checkbox.

