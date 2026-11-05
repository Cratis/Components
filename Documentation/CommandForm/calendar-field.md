---
title: CalendarField
description: CalendarField in Cratis Components binds an Arc command's Date value to a locale-aware picker with date bounds and optional time selection.
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

The accessor selects a date-valued member on the command owned by the surrounding dialog or Arc `CommandForm`; it does not supply an initial value. The field's public boundary is `Date | null`, not a date string or a React Aria calendar value. It does not define how the command serializes dates for transport.

## Props

| Prop          | Type                              | Default | Description                                                                                                                                                     |
| ------------- | --------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `(instance: TCommand) => unknown` | -       | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string`                          | -       | Placeholder text shown when no date is selected.                                                                                                                |
| `dateFormat`  | `string`                          | —       | Legacy mask retained for source compatibility; locale controls formatting.                                                                                      |
| `showIcon`    | `boolean`                         | `true`  | Displays the accessible calendar trigger next to the segmented input. Set `false` only when typed segment entry is sufficient.                                  |
| `showTime`    | `boolean`                         | `false` | Enables time selection in addition to date selection.                                                                                                           |
| `isNonModal` | `boolean`                        | `false` | Allows the first outside click to reach another control (for example a submit button) while dismissing the calendar popover. |
| `hourFormat`  | `'12' \| '24'`                    | locale  | Hour cycle when `showTime` is enabled. Without it the locale's hour cycle is used.                                                                             |
| `minDate`     | `Date`                            | -       | Minimum selectable date.                                                                                                                                        |
| `maxDate`     | `Date`                            | -       | Maximum selectable date.                                                                                                                                        |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Uses a `null` display fallback when the bound property is `undefined`, without initializing the command. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.

Clearing the picker writes `null`. If a date is required, supply an acceptable initial `Date` through `initialValues`, or use `currentValues` when the parent keeps changing it. A field's `noInitialValue` opts out of query/source population, not those explicit form values. See [Initialize command values](../CommandDialog/index.md#initialize-command-values).

The `display.datePicker` renderer slot supplies DatePickerInput's implementation. Its core React Aria renderer converts a `Date` into calendar values using the browser's local time zone and converts edits back into a local-zone `Date`. With `showTime` off, editing uses only the calendar date and can discard the original time of day; it is not a way to preserve a UTC instant. `showTime` enables time editing, and `hourFormat` selects the hour cycle. Locale controls display formatting; `dateFormat` is a legacy mask, not a free-form parser or storage format.

In the core picker, `minDate` and `maxDate` limit calendar selection. Today emits local midnight and is disabled when that value falls outside the range, including a same-day minimum with a later time when `showTime` is enabled. These UI bounds do not replace command/server validation.

The field has no top-level `disabled` or `readOnly` props. The core picker consumes `pt.input.disabled` and `pt.input.readOnly` as picker state and disables its mutation actions accordingly. Accessible naming and error descriptions follow the shared field rules above. An optional renderer must be considered separately before relying on core-specific interaction details.

Keep the default `isNonModal={false}` unless outside controls should receive the first click that dismisses the popover. Setting it to true changes outside interaction; it is not an authorization setting. See [DatePickerInput](../Common/date-picker-input.md) for the underlying parts and picker behavior.
