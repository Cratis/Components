---
title: Locale-aware number input
description: Enter controlled nullable numbers with locale formatting, explicit commits, adornments, bounds, and stable parts.
---

`NumberInput` is the standalone locale-aware numeric control. It keeps transient text separate from the controlled `number | null` value, so clearing or typing an incomplete number never fabricates `0` or exposes `NaN`.

Use the native command [`NumberField`](../CommandForm/number-field.md) when browser-native formatting and a non-null `0` default are sufficient. Use `NumberInput` or [`NumberInputField`](../CommandForm/number-input-field.md) when the interaction needs locale grouping and decimal separators, fraction policy, adornments, nullable edit state, or explicit commit timing.

## Controlled usage

```tsx
import { useState } from 'react';
import { NumberInput } from '@cratis/components/Common';

export const SampleQuantity = () => {
    const [quantity, setQuantity] = useState<number | null>(null);

    return (
        <>
            <label id='sample-quantity-label' htmlFor='sample-quantity'>
                Quantity
            </label>
            <NumberInput
                id='sample-quantity'
                aria-labelledby='sample-quantity-label'
                name='quantity'
                value={quantity}
                onChange={setQuantity}
                min={0}
                max={100}
                step={0.5}
                suffix='kg'
                minimumFractionDigits={1}
                maximumFractionDigits={2}
                description='Enter a value from zero to one hundred.'
            />
        </>
    );
};
```

The nearest `CratisComponentsProvider` supplies the BCP 47 locale. The optional `locale` prop overrides it for one control. An invalid override falls back to the provider locale.

```tsx
<CratisComponentsProvider value={{ locale: 'nb-NO' }}>
    <NumberInput value={1234.5} onChange={setValue} aria-label='Amount' />
    <NumberInput
        value={1234.5}
        onChange={setValue}
        aria-label='American amount'
        locale='en-US'
    />
</CratisComponentsProvider>
```

`useGrouping` defaults to `true`. When fraction props are omitted, decimal formatting uses the locale defaults: zero minimum fraction digits and up to three maximum fraction digits. Set both to the same number for fixed precision.

## Change and commit contract

`NumberInput` deliberately separates editable text from semantic callbacks.

| Interaction                                 | `onChange`                                                 | `onCommit`                                     |
| ------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| Type or clear without leaving the input     | No callback while text is being edited                     | No callback                                    |
| Press Enter                                 | New finite number or `null`, when it changed               | Then `Enter`                                   |
| Press Tab or otherwise blur                 | New finite number or `null`, when it changed               | Then `Blur`                                    |
| Replace the complete input through paste    | New finite number or `null`, when it changed               | Then `Paste`                                   |
| ArrowUp, ArrowDown, decrement, or increment | Stepped finite number                                      | Then `Step`                                    |
| Commit text that cannot yet form a number   | No fabricated change; text returns to the controlled value | Current controlled value and the commit reason |

A commit clamps to `min`/`max`, snaps to `step`, and rounds through the configured fraction policy. The same policy applies when a controlled prop arrives outside those boundaries: `onChange` receives the normalized value once. Until the owner accepts it, the control keeps the original value visible and withholds the named hidden input, so React state, announced content, and native form data cannot silently disagree. When both callbacks run, `onChange` always runs first. The component remains controlled: accept the value in `onChange` to display and submit it as the new value.

## Adornments and semantics

`prefix` and `suffix` render beside the editable text. They never enter the parse buffer, semantic number, or hidden form value. Each rendered adornment receives a stable id and is appended to the input's `aria-describedby` relationship, together with consumer descriptions and an active error message.

Provide an accessible name through `aria-label` or `aria-labelledby`. When a visible external label is used, give it an id, keep `htmlFor` pointed at the input id, and pass that label id through `aria-labelledby`; this also ties the localized increment and decrement action names to the field. `description` and an invalid `errorMessage` are rendered and associated automatically. The editable text control retains React Aria's number-field role description rather than reinstating the spinbutton attributes that its accessibility implementation intentionally removes for focus compatibility. Step buttons are excluded from sequential tab order; ArrowUp and ArrowDown provide the same operation from the input.

`disabled` removes the control from editing and form submission. `readOnly` keeps the value focusable and submittable while disabling edits and steps.

## Props

| Prop                                | Type                              | Default         | Behavior                                                                     |
| ----------------------------------- | --------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| `value`                             | `number \| null`                  | Required        | Controlled finite value; non-finite runtime values render empty.             |
| `onChange`                          | `(value: number \| null) => void` | Required        | Receives accepted semantic changes only.                                     |
| `onCommit`                          | `(value, reason) => void`         | —               | Receives `Blur`, `Enter`, `Paste`, or `Step` after the change callback.      |
| `locale`                            | `string`                          | Provider locale | BCP 47 locale override.                                                      |
| `useGrouping`                       | `boolean`                         | `true`          | Enables the locale grouping separator.                                       |
| `minimumFractionDigits`             | `number`                          | Locale default  | Minimum displayed fraction digits.                                           |
| `maximumFractionDigits`             | `number`                          | Locale default  | Maximum fraction digits retained on commit and shown in the formatted value. |
| `required`                          | `boolean`                         | `false`         | Requires a non-empty value using native form and accessibility semantics.    |
| `min` / `max`                       | `number`                          | Unbounded       | Commit boundaries and number-field range.                                    |
| `step`                              | `number`                          | `1`             | Step and commit-snap interval.                                               |
| `prefix` / `suffix`                 | `ReactNode`                       | —               | Associated presentation outside the numeric value.                           |
| `placeholder`                       | `string`                          | —               | Empty edit hint.                                                             |
| `disabled` / `readOnly` / `invalid` | `boolean`                         | `false`         | Semantic and visual state.                                                   |
| `id` / `name`                       | `string`                          | Generated / —   | Label association and native form field name.                                |
| `description` / `errorMessage`      | `ReactNode`                       | —               | Associated help and invalid-state content.                                   |
| `pt`                                | `NumberInputParts`                | —               | Renderer-independent part classes, styles, titles, and data attributes.      |

## Stable parts and tokens

| Typed `pt` key / DOM part | Meaning                                                             | Canonical states                             |
| ------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| `root`                    | Complete field                                                      | `disabled`, `invalid`, `readonly`            |
| `input`                   | Editable localized text                                             | `disabled`, `invalid`, `readonly`, `focused` |
| `prefix` / `suffix`       | Present adornment                                                   | `disabled`, `invalid`, `readonly`            |
| `step`                    | Both step buttons; inspect `data-step='decrement'` or `'increment'` | `disabled`, `invalid`, `readonly`            |
| `description`             | Supporting text                                                     | none                                         |
| `error`                   | Active validation message                                           | `invalid`                                    |

The component uses the shared control, surface, text, focus, disabled, and error tokens plus these aliases:

- `--cratis-number-input-adornment-color`
- `--cratis-number-input-step-background`
- `--cratis-number-input-step-background-hover`

Use parts and tokens rather than internal element order or implementation-library selectors.
