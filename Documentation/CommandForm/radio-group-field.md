# RadioGroupField

`RadioGroupField` renders a group of PrimeReact `RadioButton` components from an options array, allowing the user to select a single value.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RadioGroupField } from '@cratis/components/CommandForm';

const sizeOptions = [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' },
];

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <RadioGroupField<MyCommand>
        value={c => c.size}
        options={sizeOptions}
        optionLabel="label"
        optionValue="id"
        title="Size"
    />
</CommandDialog>
```

With horizontal layout:

```tsx
<RadioGroupField<MyCommand>
    value={c => c.priority}
    options={priorityOptions}
    optionLabel="label"
    optionValue="id"
    title="Priority"
    layout="horizontal"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `options` | `Array<Record<string, unknown>>` | — | **Required.** Array of option objects. |
| `optionLabel` | `string` | — | **Required.** Key in each option object to use as the display label. |
| `optionValue` | `string` | — | **Required.** Key in each option object to use as the submitted value. |
| `layout` | `'horizontal' \| 'vertical'` | `'vertical'` | Controls whether the radio buttons are stacked vertically or laid out in a horizontal row. |

## Behavior

- Default value is an empty string.
- A radio button is checked when the current field value equals its `optionValue`.
- Validation state is reflected via the PrimeReact `invalid` flag on all radio buttons.
