# TextAreaField

`TextAreaField` wraps the PrimeReact `InputTextarea` component for multi-line text input.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { TextAreaField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <TextAreaField<MyCommand> value={c => c.description} placeholder="Enter a description" rows={4} />
    <TextAreaField<MyCommand> value={c => c.notes} rows={3} />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `rows` | `number` | `5` | Number of visible text rows. |
| `cols` | `number` | — | Number of visible text columns. |

## Behavior

- Default value is an empty string.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.

