# RadioButtonField

`RadioButtonField` renders a Cratis-owned native radio option that sets the bound command property to a specific value when selected. Use multiple `RadioButtonField` components bound to the same property to form a radio group.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RadioButtonField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <RadioButtonField<MyCommand> name="size" value={c => c.size} buttonValue="small" label="Small" />
    <RadioButtonField<MyCommand> name="size" value={c => c.size} buttonValue="medium" label="Medium" />
    <RadioButtonField<MyCommand> name="size" value={c => c.size} buttonValue="large" label="Large" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `buttonValue` | `string \| number` | — | **Required.** The value this radio button represents. When selected, the command property is set to this value. |
| `name` | `string` | — | **Required.** Native group name shared by every option bound to the same command property. |
| `label` | `string` | — | Text displayed inline next to the radio button. |

## Behavior

- Default value is an empty string.
- The radio button is checked when the current field value equals `buttonValue`.
- Options with the same `name` use native arrow-key radio navigation and one tab stop.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
