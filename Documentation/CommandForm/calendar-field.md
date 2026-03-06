# CalendarField

`CalendarField` wraps the PrimeReact `Calendar` component for selecting date values.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { CalendarField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <CalendarField<MyCommand>
        value={c => c.startDate}
        placeholder="Select a date"
        showIcon
        dateFormat="mm/dd/yy"
    />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | - | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | - | Placeholder text shown when no date is selected. |
| `dateFormat` | `string` | PrimeReact default | Date display and parsing format used by the calendar input. |
| `showIcon` | `boolean` | `false` | Displays a calendar icon button next to the input. |
| `showTime` | `boolean` | `false` | Enables time selection in addition to date selection. |
| `hourFormat` | `'12' \| '24'` | `24` | Hour format when `showTime` is enabled. |
| `minDate` | `Date` | - | Minimum selectable date. |
| `maxDate` | `Date` | - | Maximum selectable date. |

## Behavior

- Default value is `null`.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.
