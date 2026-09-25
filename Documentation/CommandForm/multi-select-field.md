---
title: MultiSelectField
description: Bind an array property on an Arc command to a multi-select dropdown.
---

`MultiSelectField` lets the user pick several values through the Cratis [`Dropdown`](../Dropdown/index.md). It uses native multiple selection by default and a labeled multi-value combobox when filtering is enabled.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { MultiSelectField } from '@cratis/components/CommandForm';

const categoryOptions = [
    { id: 'finance', label: 'Finance' },
    { id: 'operations', label: 'Operations' },
    { id: 'engineering', label: 'Engineering' },
];

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit categories'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <MultiSelectField<MyCommand>
        value={(c) => c.categories}
        title='Categories'
        options={categoryOptions}
        optionLabel='label'
        optionValue='id'
        placeholder='Select categories'
        filter
    />
</CommandDialog>;
```

## Props

| Prop                     | Type                              | Default | Description                                                                                                                                                     |
| ------------------------ | --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                  | `(instance: TCommand) => unknown` | -       | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `options`                | `Array<Record<string, unknown>>`  | -       | **Required.** Array of option objects.                                                                                                                          |
| `optionLabel`            | `string`                          | -       | Property name in each option object used as the display text.                                                                                                   |
| `optionValue`            | `string`                          | -       | Property name in each option object used as the bound value.                                                                                                    |
| `placeholder`            | `string`                          | -       | Placeholder text shown when no options are selected.                                                                                                            |
| `display`                | `'comma' \| 'chip'`               | -       | **No effect.** See below.                                                                                                                                       |
| `maxSelectedLabels`      | `number`                          | -       | **No effect.** See below.                                                                                                                                       |
| `filter`                 | `boolean`                         | `false` | Shows a filter input in the options popup.                                                                                                                      |
| `showClear`              | `boolean`                         | `false` | Displays a clear icon to reset selected values.                                                                                                                 |
| `className`              | `string`                          | -       | Extra CSS class combined with the default `w-full`.                                                                                                             |
| `pt`                     | `DropdownParts`                   | —       | Attributes for the Cratis-owned Dropdown's stable parts.                                                                                                        |
| `ptOptions` / `unstyled` | —                                 | —       | Retained temporarily for source compatibility; ignored.                                                                                                         |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty array while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.

:::note[Legacy props with no effect]
`display` and `maxSelectedLabels` are legacy compatibility props and have no effect. Use a dedicated collection picker when a large multi-select needs chip collapsing or virtualized search.
:::
