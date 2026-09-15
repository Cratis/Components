---
title: NumberInput
description: A locale-aware numeric input with grouping, fraction digits, and inline unit decorations.
---

`NumberInput` formats a number the way the reader's locale writes it — grouping separators, decimal
separator, and a stable number of fraction digits — while the value you bind stays an ordinary
`number | null`.

```tsx
import { useState } from 'react';
import { NumberInput } from '@cratis/components/Common';

const [price, setPrice] = useState<number | null>(12500.5);

<NumberInput
    value={price}
    onChange={setPrice}
    locale='de-DE'
    prefix='€'
    minimumFractionDigits={2}
    maximumFractionDigits={2}
    aria-label='Price'
/>;
```

The same value renders as `12.500,50` in `de-DE`, `12,500.50` in `en-US`, and `12 500,50` in `fr-FR`.
Formatting is presentation only: `onChange` always reports the numeric value, never the formatted text.

## Numbers that are identifiers, not quantities

A year, an order number or a postal code is read as a label rather than a quantity, and a grouping
separator makes it wrong — `2026` should not render as `2 026`. Set `useGrouping={false}` to drop the
separator while keeping the locale's decimal handling.

```tsx
<NumberInput value={year} onChange={setYear} useGrouping={false} aria-label='Year' />
```

## Empty is not zero

`null` is the empty field, and it stays distinct from `0` in both directions. A cleared field reports
`null` rather than coercing to `0`, so "no answer given" and "the answer is zero" remain different
facts — which matters when the value drives a calculation or a required-field rule.

```tsx
<NumberInput value={null} onChange={setValue} placeholder='Enter a number' aria-label='Quantity' />
```

## Prefix and suffix are decoration

`prefix` and `suffix` render as separate elements beside the input, and are **never folded into the
value**. A unit label is not part of the number: the user does not have to type or delete it, selecting
the field's text does not select it, and it never reaches `onChange`.

```tsx
<NumberInput value={rate} onChange={setRate} prefix='€' suffix='/hr' aria-label='Hourly rate' />
```

## Bounds and stepping

`min` and `max` clamp the committed value, and `step` sets the increment used by the `ArrowUp` and
`ArrowDown` keys. Clamping happens on commit rather than per keystroke, so a value typed digit by
digit is not fought while it is still being entered.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number \| null` | — | **Required.** The bound value. `null` is empty. |
| `onChange` | `ChangeHandler<number \| null>` | — | **Required.** Called with the committed value and change-origin metadata. |
| `locale` | `string` | provider locale | BCP 47 locale used for grouping and decimal separators. |
| `minimumFractionDigits` | `number` | — | Minimum fraction digits in the formatted display. |
| `maximumFractionDigits` | `number` | — | Maximum fraction digits in the formatted display. |
| `useGrouping` | `boolean` | `true` | Whether the locale's grouping separator is applied. |
| `min` | `number` | — | Minimum allowed value, clamped on commit. |
| `max` | `number` | — | Maximum allowed value, clamped on commit. |
| `step` | `number` | — | Increment for keyboard and stepper interaction. |
| `prefix` | `string` | — | Inline decoration before the value. Never part of the value. |
| `suffix` | `string` | — | Inline decoration after the value. Never part of the value. |
| `invalid` | `boolean` | `false` | Marks the input invalid and exposes the canonical invalid state. |
| `disabled` | `boolean` | `false` | Disables the input. |
| `readOnly` | `boolean` | `false` | Prevents editing while retaining focus semantics. |
| `placeholder` | `string` | — | Visible text while the field is empty. |
| `id` | `string` | — | DOM id for the input element. |
| `aria-label` | `string` | — | Accessible name when no external label is supplied. |
| `aria-labelledby` | `string` | — | Id of the element that labels the input. |
| `aria-describedby` | `string` | — | Id of the element that describes the input. |
| `className` | `string` | — | Extra class name for the outer wrapper. |
| `style` | `CSSProperties` | — | Inline style for the outer wrapper. |
| `pt` | `NumberInputParts` | — | Per-part attributes for `root`, `input`, `prefix`, and `suffix`. |

## Accessibility

The control renders as `input[type=text]` with `inputmode="numeric"` and an `aria-roledescription`
naming it a number field. React Aria deliberately does not take the `spinbutton` role, which suppresses
text editing in several screen readers; the trade-off is that there is no `aria-valuenow`/`aria-valuemin`
/`aria-valuemax` range announcement. Give the control a name through `aria-label` or `aria-labelledby`.
The canonical `disabled`, `invalid`, and `readonly` states are exposed on the `root` and `input` parts
for styling.

`NumberField` remains the native `input[type=number]` control, which keeps the browser's own spinner
semantics if a range announcement matters more than locale formatting.

## See also

- [Basic controls](basic-controls.md) — the native control contracts
- [NumberInputField](../CommandForm/number-input-field.md) — the same control bound to an Arc command
- [NumberField](../CommandForm/number-field.md) — the native numeric field without locale formatting
