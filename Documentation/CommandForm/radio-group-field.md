---
title: RadioGroupField
description: Bind a property on an Arc command to a native radio group built from an options array.
---

`RadioGroupField` renders a Cratis-owned native radio group from an options array.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RadioGroupField } from '@cratis/components/CommandForm';

const sizeOptions = [
    { id: 'small', label: 'Small' },
    { id: 'medium', label: 'Medium' },
    { id: 'large', label: 'Large' },
];

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Choose size'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <RadioGroupField<MyCommand>
        value={(c) => c.size}
        options={sizeOptions}
        optionLabel='label'
        optionValue='id'
        title='Size'
    />
</CommandDialog>;
```

With horizontal layout:

```tsx
<RadioGroupField<MyCommand>
    value={(c) => c.priority}
    options={priorityOptions}
    optionLabel='label'
    optionValue='id'
    title='Priority'
    layout='horizontal'
/>
```

## Props

| Prop          | Type                              | Default      | Description                                                                                                                                                     |
| ------------- | --------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `(instance: TCommand) => unknown` | —            | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `options`     | `Array<Record<string, unknown>>`  | —            | **Required.** Array of option objects.                                                                                                                          |
| `optionLabel` | `string`                          | —            | **Required.** Key in each option object to use as the display label.                                                                                            |
| `optionValue` | `string`                          | —            | **Required.** Key in each option object to use as the submitted value.                                                                                          |
| `layout`      | `'horizontal' \| 'vertical'`      | `'vertical'` | Controls whether the radio buttons are stacked vertically or laid out in a horizontal row.                                                                      |
| `name`        | `string`                          | generated    | Optional native radio-group name. All options in the component always share one name.                                                                           |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- A radio button is checked when the current field value equals its `optionValue`.
- The options share one native name for arrow-key navigation and a single tab stop.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
