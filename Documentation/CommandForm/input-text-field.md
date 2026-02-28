# InputTextField

`InputTextField` wraps the PrimeReact `InputText` component for single-line text input. It supports all standard HTML input types.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { InputTextField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <InputTextField<MyCommand> value={c => c.username} placeholder="Enter username" />
    <InputTextField<MyCommand> value={c => c.email} type="email" placeholder="Enter email" />
    <InputTextField<MyCommand> value={c => c.password} type="password" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `type` | `'text' \| 'email' \| 'password' \| 'color' \| 'date' \| 'datetime-local' \| 'time' \| 'url' \| 'tel' \| 'search'` | `'text'` | The HTML input type. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |

## Behavior

- Default value is an empty string.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.

