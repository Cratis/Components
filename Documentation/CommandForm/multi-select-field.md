# MultiSelectField

`MultiSelectField` wraps the PrimeReact `MultiSelect` component for selecting multiple values from a list.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { MultiSelectField } from '@cratis/components/CommandForm';

const categoryOptions = [
    { id: 'finance', label: 'Finance' },
    { id: 'operations', label: 'Operations' },
    { id: 'engineering', label: 'Engineering' },
];

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <MultiSelectField<MyCommand>
        value={c => c.categories}
        options={categoryOptions}
        optionLabel="label"
        optionValue="id"
        placeholder="Select categories"
        display="chip"
        filter
    />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | - | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `options` | `Array<Record<string, unknown>>` | - | **Required.** Array of option objects. |
| `optionLabel` | `string` | - | Property name in each option object used as the display text. |
| `optionValue` | `string` | - | Property name in each option object used as the bound value. |
| `placeholder` | `string` | - | Placeholder text shown when no options are selected. |
| `display` | `'comma' \| 'chip'` | PrimeReact default | How selected values are rendered in the input. |
| `maxSelectedLabels` | `number` | PrimeReact default | Maximum number of labels to render before collapsing. |
| `filter` | `boolean` | PrimeReact default | Enables filtering in the options panel. |
| `showClear` | `boolean` | `false` | Displays a clear icon to reset selected values. |

## Behavior

- Default value is an empty array.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.
