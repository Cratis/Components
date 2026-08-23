# MultiSelectField

`MultiSelectField` lets the user pick several values through the Cratis [`Dropdown`](../Dropdown/index.md) native multiple-selection path.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { MultiSelectField } from '@cratis/components/CommandForm';

const categoryOptions = [
    { id: 'finance', label: 'Finance' },
    { id: 'operations', label: 'Operations' },
    { id: 'engineering', label: 'Engineering' },
];

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <MultiSelectField<MyCommand>
        value={(c) => c.categories}
        options={categoryOptions}
        optionLabel='label'
        optionValue='id'
        placeholder='Select categories'
        filter
    />
</CommandDialog>;
```

## Props

| Prop                            | Type                              | Default | Description                                                                                                                                                     |
| ------------------------------- | --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                         | `(instance: TCommand) => unknown` | -       | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `options`                       | `Array<Record<string, unknown>>`  | -       | **Required.** Array of option objects.                                                                                                                          |
| `optionLabel`                   | `string`                          | -       | Property name in each option object used as the display text.                                                                                                   |
| `optionValue`                   | `string`                          | -       | Property name in each option object used as the bound value.                                                                                                    |
| `placeholder`                   | `string`                          | -       | Placeholder text shown when no options are selected.                                                                                                            |
| `display`                       | `'comma' \| 'chip'`               | -       | **No effect.** See below.                                                                                                                                       |
| `maxSelectedLabels`             | `number`                          | -       | **No effect.** See below.                                                                                                                                       |
| `filter`                        | `boolean`                         | `false` | Shows a filter input in the options popup.                                                                                                                      |
| `showClear`                     | `boolean`                         | `false` | Displays a clear icon to reset selected values.                                                                                                                 |
| `className`                     | `string`                          | -       | Extra CSS class combined with the default `w-full`.                                                                                                             |
| `pt` / `ptOptions` / `unstyled` | -                                 | -       | Pass-through styling for the underlying `Select`.                                                                                                               |

## Behavior

- Default value is an empty array.
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.

> [!IMPORTANT]
> `display` and `maxSelectedLabels` are legacy compatibility props and have no effect. Use a dedicated collection picker when a large multi-select needs chip collapsing or virtualized search.
