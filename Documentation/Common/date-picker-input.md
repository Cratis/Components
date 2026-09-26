---
title: DatePickerInput
description: Enter a controlled Date | null through locale-aware segments and a calendar popover, with bounds, Today and Clear actions, and stable parts.
---

`DatePickerInput` is the standalone date and date-time picker. The user types into locale-ordered segments (day, month, year and, optionally, hour and minute) or picks a day from a calendar popover. Your code only sees a plain JavaScript `Date | null`; the React Aria calendar values the control uses internally never cross its props.

Use it for date entry in ordinary React state. To bind a `Date` property on an Arc command, use [`CalendarField`](../CommandForm/calendar-field.md), which wraps this control.

```tsx
import { DatePickerInput } from '@cratis/components/Common';
```

## Controlled usage

```tsx
import { useState } from 'react';
import { DatePickerInput } from '@cratis/components/Common';

export const SampleDeliveryDate = () => {
    const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
    const earliest = new Date(2030, 0, 1);
    const latest = new Date(2030, 11, 31);
    const outOfRange =
        deliveryDate !== null && (deliveryDate < earliest || deliveryDate > latest);

    return (
        <div>
            <DatePickerInput
                id='sample-delivery-date'
                aria-label='Delivery date'
                aria-describedby='sample-delivery-date-help'
                value={deliveryDate}
                onChange={setDeliveryDate}
                minDate={earliest}
                maxDate={latest}
                invalid={outOfRange}
                placeholder='Choose a date'
                showButtonBar
            />
            <p id='sample-delivery-date-help'>
                {outOfRange ? 'Pick a date in 2030.' : 'Deliveries run throughout 2030.'}
            </p>
        </div>
    );
};
```

Render it under [`CratisComponentsProvider`](cratis-components-provider.md) so the locale and labels come from your configuration. Without the provider, the labels use the English defaults and React Aria falls back to the browser's locale. `value` and `onChange` are both required: the control is controlled, so pass the new date back through `value`.

`minDate`/`maxDate` disable out-of-range calendar cells and the Today action, but typing or stepping a segment can still produce an out-of-range date, and `onChange` receives it. The example therefore computes `invalid` from the value itself. See [Validation and states](#validation-and-states).

## Value and change contract

| Aspect | Behavior |
| --- | --- |
| Value type | `Date \| null`. `null` means no date. Conversion to and from `@internationalized/date` happens inside the component. |
| Time zone | Conversions use the browser's local time zone. |
| Date-only mode (default) | The time portion of an incoming `value` is ignored. Emitted dates are local midnight. |
| Date-time mode (`showTime`) | Hour and minute segments are added. `minDate`/`maxDate` are compared including their time. |
| `onChange` signature | `(value: Date \| null, meta?: ChangeMeta) => void`. A React state setter can be passed directly. |
| `meta.source` | `'user'` for every change the component emits. |
| `meta.nativeEvent` | Present for the Today and Clear actions; absent for segment and calendar changes. |
| Segment editing | `onChange` fires when the segments form a complete date. Clearing one segment leaves the last complete value in place without a callback; clearing every segment emits `null`. |
| Today action | Emits today's date (local midnight, also in date-time mode). Disabled and inert when today falls outside `minDate`/`maxDate`, or the picker is disabled or read-only. |
| Clear action | Emits `null`. Disabled and inert when the picker is disabled or read-only. |
| Programmatic changes | Changing `value` from outside never calls `onChange`. |
| Disabled or read-only | Segments cannot change the value. The trigger and Today/Clear actions are disabled; read-only segments remain focusable, but cannot open the calendar with `Alt+ArrowDown`/`Alt+ArrowUp`. |

The Today and Clear buttons call `onChange` directly; they do not close the popover themselves.

## Props

| Prop | Type | Default | Behavior |
| --- | --- | --- | --- |
| `value` | `Date \| null` | Required | Controlled value. |
| `onChange` | `ChangeHandler<Date \| null>` | Required | Receives the next date or `null` and optional change metadata. |
| `onBlur` | `FocusEventHandler<HTMLElement>` | — | Attached to the root wrapper. React focus events bubble, so it also fires when focus moves between segments or into the calendar, not only when focus leaves the picker. |
| `invalid` | `boolean` | `false` | Marks the picker invalid. See [Validation and states](#validation-and-states). |
| `disabled` | `boolean` | `false` | Disables the segments, trigger, calendar and Today/Clear actions. |
| `readOnly` | `boolean` | `false` | Keeps segments focusable but prevents editing; disables the trigger and Today/Clear actions and prevents opening the calendar with `Alt+ArrowDown`/`Alt+ArrowUp`. |
| `id` | `string` | — | DOM id of the segmented-input group. |
| `placeholder` | `string` | — | Text shown while the value is `null` and the field is not focused. Also used as the accessible name when `aria-label` is absent. |
| `showIcon` | `boolean` | `true` | Renders the calendar trigger button. Without it, the calendar is still reachable with `Alt+ArrowDown`. |
| `showButtonBar` | `boolean` | `false` | Adds Today and Clear actions below the calendar. |
| `showTime` | `boolean` | `false` | Adds hour and minute segments. |
| `hourFormat` | `'12' \| '24'` | Locale | Hour cycle for the time segments. Omit it to use the locale's hour cycle. |
| `minDate` / `maxDate` | `Date` | Unbounded | Earliest and latest selectable date for the calendar and the Today action. |
| `todayLabel` / `clearLabel` | `string` | Provider message | Per-instance labels for the Today and Clear actions. |
| `aria-label` | `string` | See [Labels](#locale-and-labels) | Accessible name of the segmented-input group. |
| `aria-labelledby` | `string` | — | Id of an element that labels the picker. |
| `aria-describedby` | `string` | — | Id of an element that describes the picker. |
| `className` | `string` | — | Added to the root element, after `pt.root.className`. |
| `style` | `CSSProperties` | — | Inline style on the root element; merged over `pt.root.style`. |
| `pt` | `DatePickerInputPassThrough` | — | Per-part attributes. See [Stable parts](#stable-parts). |
| `dateFormat` | `string` | — | Accepted for source compatibility and ignored. The locale controls formatting. |
| `ptOptions` | `object` | — | Deprecated and ignored. Parts always merge. |
| `unstyled` | `boolean` | — | Deprecated and ignored. Style through `pt` and CSS. |

`DatePickerInputProps` and `DatePickerInputPassThrough` are exported types.

Top-level props take precedence over their `pt.input` equivalents. When a top-level prop is omitted, the component falls back to `pt.input.id`, `disabled`, `readOnly`, `placeholder`, `aria-invalid`, `aria-label`, `aria-labelledby` and `aria-describedby`; `pt.input.id` is applied to the group, like `id`. Other `pt.input` attributes, such as `data-*`, are forwarded to the segmented input.

## Locale and labels

The locale comes from the nearest `CratisComponentsProvider` (`value.locale`, default `en-US`; an invalid locale also falls back to `en-US`). It decides segment order, separators, the calendar system and the default hour cycle. There is no per-instance locale prop.

Components-owned text comes from `messages.datePicker`:

| Message key | Used for | Default |
| --- | --- | --- |
| `label` | Accessible name fallback for the segmented input | `Date` |
| `today` | Today action | `Today` |
| `clear` | Clear action | `Clear` |
| `openCalendar` | Calendar trigger name | `Open calendar` |
| `previousMonth` | Previous-month button name | `Previous month` |
| `nextMonth` | Next-month button name | `Next month` |

```tsx
import { CratisComponentsProvider } from '@cratis/components';

<CratisComponentsProvider
    value={{
        locale: 'nb-NO',
        messages: {
            datePicker: {
                label: 'Dato',
                today: 'I dag',
                clear: 'Tøm',
                openCalendar: 'Åpne kalender',
                previousMonth: 'Forrige måned',
                nextMonth: 'Neste måned',
            },
        },
    }}
>
    <SampleDeliveryDate />
</CratisComponentsProvider>;
```

Resolution order for each text:

- **Accessible name:** `aria-label` → `pt.input['aria-label']` → `placeholder` → `messages.datePicker.label` → `Date`.
- **Today / Clear:** `todayLabel` / `clearLabel` → `messages.datePicker.today` / `.clear` → English default.
- **Trigger and month buttons:** `pt.trigger`, `pt.previous` or `pt.next` `aria-label` → provider message → English default.

The previous- and next-month glyphs follow the provider's `icons.previous` and `icons.next`. See [Localize owned labels](cratis-components-provider.md#localize-owned-labels) and [Register an icon set](cratis-components-provider.md#register-an-icon-set).

## Keyboard and screen readers

The segmented input, calendar and popover are React Aria's `DatePicker` parts. The behavior below is what React Aria provides in the installed version; verify it with the assistive technologies your application supports.

| Key | Where | Effect |
| --- | --- | --- |
| `Tab` / `Shift+Tab` | Segments, trigger | Each editable segment is its own tab stop, followed by the trigger. |
| `ArrowLeft` / `ArrowRight` | Segment | Move to the previous or next segment (visual order in right-to-left locales). |
| `ArrowUp` / `ArrowDown` | Segment | Increment or decrement the segment, wrapping at its limits. |
| `PageUp` / `PageDown` | Segment | Step by a larger amount (for example 7 days, 2 months, 5 years, 15 minutes). |
| `Home` / `End` | Segment | Set the segment to its minimum or maximum. |
| Digits | Segment | Type the segment value. |
| `Backspace` / `Delete` | Segment | Remove the last digit, then clear the segment. |
| `Alt+ArrowDown` / `Alt+ArrowUp` | Segmented input | Open the calendar popover unless the picker is read-only. |

Inside the popover, the calendar grid follows React Aria's calendar keyboard model; see the [React Aria DatePicker documentation](https://react-spectrum.adobe.com/react-aria/DatePicker.html).

What assistive technology receives:

- The segmented input is a `group` carrying the resolved accessible name, `aria-labelledby`, `aria-describedby` and, when `invalid` is set, `aria-invalid`.
- Each editable segment is a `spinbutton` named with its localized segment type followed by the group's name, for example "month, Delivery date". On iOS, where VoiceOver cannot focus spinbuttons, React Aria renders segments as `textbox` instead.
- Separator segments (such as `/` or `.`) are hidden from assistive technology.
- `aria-describedby` is applied to the first editable segment only, unless the field is invalid, so the description is not repeated on every segment.
- The visible placeholder is `aria-hidden`; its text reaches screen readers as the accessible name fallback instead.
- The trigger, previous-month and next-month buttons have the localized names listed above; their glyphs are `aria-hidden`.

:::caution[Naming with aria-labelledby]
The group always carries a resolved `aria-label` (falling back to `Date`). React Aria then adds the group itself to `aria-labelledby`, so a picker labelled only by `aria-labelledby` is announced as "Date" followed by the referenced text. When that prefix is unwanted, pass `aria-label` with the visible label text instead of `aria-labelledby`. A `<label htmlFor>` pointing at `id` does not name the picker, because the target is a `div` group, not a form control.
:::

Editable segments are at least 24 × 24 CSS pixels through the built-in stylesheet; separators are excluded. The `SegmentHitTargets` and `NarrowShowTime12Hour` stories assert that geometry in the browser test matrix. CSS that overrides `.cratis-date-picker__segment` or the `segment` part can undo it.

## Validation and states

`invalid` is the only input to the Cratis invalid state. When it is `true`, the root, group, input, every segment and the trigger get `data-invalid="true"`, the group gets `aria-invalid="true"`, and the built-in stylesheet draws the group border in the error color. When it is `false`, no invalid attribute is rendered.

The component does not display an error message. Render one yourself and connect it with `aria-describedby`, as in the [example](#controlled-usage).

Out-of-range values are not flagged for you. A date typed or stepped past `minDate`/`maxDate` reaches `onChange` and does not set `data-invalid`. Check the range in your own code and set `invalid` from the result.

`disabled` sets `data-disabled` on the root, group, input, segments, trigger and Today/Clear actions, and disables the trigger and actions. `readOnly` sets `data-readonly` on the root, group, input, segments and trigger and disables the trigger (which then also carries `data-disabled`) and Today/Clear actions (which also carry `data-disabled`), but leaves the root without `data-disabled`.

## Stable parts

Each part below carries `data-cratis-part` with the name in the DOM part column. Style and query these names rather than internal class names or React Aria markup. The `popover` and its descendants are portaled into the provider's overlay container, so query them from `document`, not from the picker's container. See [Choose an overlay container](cratis-components-provider.md#choose-an-overlay-container).

| `pt` key | DOM part | Element | Canonical states |
| --- | --- | --- | --- |
| `root` | `root` | Outer wrapper | `disabled`, `selected`, `open`, `invalid`, `readonly` |
| `group` | `group` | Focusable segmented-input group; also `data-empty` while `value` is `null` | `disabled`, `selected`, `open`, `invalid`, `readonly` |
| `input` | `input` | Segmented date input | `disabled`, `selected`, `open`, `invalid`, `readonly` |
| `segment` | `segment` | One date/time segment; `data-type` names it, for example `day`, `month`, `year`, `hour`, `minute`, `dayPeriod` or `literal` | `disabled`, `invalid`, `readonly` |
| `placeholder` | `placeholder` | Visible empty-value text | none |
| `trigger` | `trigger` | Calendar trigger button | `disabled`, `selected`, `open`, `invalid`, `readonly` |
| `popover` | `popover` | Portaled calendar popover | `open` |
| `dialog` | `dialog` | Calendar dialog | `open` |
| `calendar` | `calendar` | Calendar root | `open` |
| `header` | `header` | Month navigation row | none |
| `previous` | `previous` | Previous-month button | none |
| `heading` | `heading` | Current month and year | none |
| `next` | `next` | Next-month button | none |
| `grid` | `grid` | Calendar grid | none |
| `cell` | `cell` | One day cell | `selected` |
| `buttonBar` | `button-bar` | Today/Clear row | none |
| `today` | `today` | Today action | `disabled` |
| `clear` | `clear` | Clear action | `disabled` |

The Cratis state attributes are present only while the state applies and are never rendered as `"false"`. React Aria adds its own attributes on some parts, such as `data-focused` and `data-placeholder` on segments and `data-disabled` or `data-outside-month` on cells; the built-in stylesheet uses them, but they are not part of the Cratis state contract.

The `pt` key for the Today/Clear row is `buttonBar`, while its DOM part is `button-bar`. For the shared `pt` model, state vocabulary and cascade rules, see [Pass-through](../Styling/pass-through.md) and the [Styling overview](../Styling/index.md).

`DatePickerInput` renders through the `display.datePicker` slot. The bundled renderer adapters do not declare that slot, so the built-in implementation described here renders unless an adapter explicitly provides one. See [Renderers](../renderers/index.md).

## See also

- [`CalendarField`](../CommandForm/calendar-field.md) — the command-bound field built on this control
- [CratisComponentsProvider](cratis-components-provider.md) — locale, `messages.datePicker` and icons
- [Pass-through](../Styling/pass-through.md) — the shared `pt` and part model
