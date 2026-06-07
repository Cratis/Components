# RadioButtonField

`RadioButtonField` renders a single PrimeReact `RadioButton` that sets the bound command property to a specific value when selected. Use multiple `RadioButtonField` components bound to the same property to form a radio group.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RadioButtonField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <RadioButtonField<MyCommand> value={c => c.size} buttonValue="small" label="Small" />
    <RadioButtonField<MyCommand> value={c => c.size} buttonValue="medium" label="Medium" />
    <RadioButtonField<MyCommand> value={c => c.size} buttonValue="large" label="Large" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `buttonValue` | `string \| number` | — | **Required.** The value this radio button represents. When selected, the command property is set to this value. |
| `label` | `string` | — | Text displayed inline next to the radio button. |

## Behavior

- Default value is an empty string.
- The radio button is checked when the current field value equals `buttonValue`.
- Validation state is reflected via the PrimeReact `invalid` flag on the radio button.
