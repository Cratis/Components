# NumberField

`NumberField` wraps the PrimeReact `InputNumber` component for numeric input with optional constraints.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { NumberField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <NumberField<MyCommand> value={c => c.quantity} min={1} max={100} />
    <NumberField<MyCommand> value={c => c.price} min={0} step={0.01} placeholder="0.00" />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `min` | `number` | — | Minimum allowed value. |
| `max` | `number` | — | Maximum allowed value. |
| `step` | `number` | — | Increment/decrement step size. |

## Behavior

- Default value is `0`.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.
- When the value is cleared, it falls back to `0`.

