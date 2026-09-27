---
title: CalendarField
description: Bind a Date property on an Arc command to the locale-aware Cratis date picker.
---

`CalendarField` wraps the internationalized Cratis [`DatePickerInput`](../Common/date-picker-input.md) while preserving a `Date | null` command value.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { CalendarField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Schedule'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <CalendarField<MyCommand>
        value={(c) => c.startDate}
        title='Start date'
        placeholder='Select a date'
        showIcon
    />
</CommandDialog>;
```

## Props

| Prop          | Type                              | Default | Description                                                                                                                                                     |
| ------------- | --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `(instance: TCommand) => unknown` | -       | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string`                          | -       | Placeholder text shown when no date is selected.                                                                                                                |
| `dateFormat`  | `string`                          | —       | Legacy mask retained for source compatibility; locale controls formatting.                                                                                      |
| `showIcon`    | `boolean`                         | `true`  | Displays the accessible calendar trigger next to the segmented input. Set `false` only when typed segment entry is sufficient.                                  |
| `showTime`    | `boolean`                         | `false` | Enables time selection in addition to date selection.                                                                                                           |
| `hourFormat`  | `'12' \| '24'`                    | locale  | Hour cycle when `showTime` is enabled. Without it the locale's hour cycle is used.                                                                             |
| `minDate`     | `Date`                            | -       | Minimum selectable date.                                                                                                                                        |
| `maxDate`     | `Date`                            | -       | Maximum selectable date.                                                                                                                                        |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows `null` while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
