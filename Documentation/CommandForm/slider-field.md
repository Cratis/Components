# SliderField

`SliderField` wraps the PrimeReact `Slider` component for selecting a numeric value within a range. The current value is displayed below the slider.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { SliderField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <SliderField<MyCommand> value={c => c.volume} min={0} max={100} step={5} />
    <SliderField<MyCommand> value={c => c.experience} min={0} max={50} />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `min` | `number` | `0` | Minimum value. |
| `max` | `number` | `100` | Maximum value. |
| `step` | `number` | `1` | Step increment. |

## Behavior

- Default value is `0`.
- The slider spans full width within its container.
- The selected numeric value is rendered centered beneath the slider track.

