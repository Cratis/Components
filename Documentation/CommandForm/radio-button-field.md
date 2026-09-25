---
title: RadioButtonField
description: Bind a property on an Arc command to one native radio option.
---

`RadioButtonField` renders a Cratis-owned native radio option that sets the bound command property to a specific value when selected. Use multiple `RadioButtonField` components bound to the same property to form a radio group.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RadioButtonField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Choose size'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <RadioButtonField<MyCommand>
        name='size'
        value={(c) => c.size}
        buttonValue='small'
        label='Small'
    />
    <RadioButtonField<MyCommand>
        name='size'
        value={(c) => c.size}
        buttonValue='medium'
        label='Medium'
    />
    <RadioButtonField<MyCommand>
        name='size'
        value={(c) => c.size}
        buttonValue='large'
        label='Large'
    />
</CommandDialog>;
```

## Props

| Prop          | Type                              | Default | Description                                                                                                                                                     |
| ------------- | --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `(instance: TCommand) => unknown` | —       | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `buttonValue` | `string \| number`                | —       | **Required.** The value this radio button represents. When selected, the command property is set to this value.                                                 |
| `name`        | `string`                          | —       | **Required.** Native group name shared by every option bound to the same command property.                                                                      |
| `label`       | `string`                          | —       | Text displayed inline next to the radio button.                                                                                                                 |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The radio button is checked when the current field value equals `buttonValue`.
- Options with the same `name` use native arrow-key radio navigation and one tab stop.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
