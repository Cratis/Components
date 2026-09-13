# NumberInputField

`NumberInputField` binds a locale-aware numeric input to a number property on an Arc command. It is
the [`NumberInput`](../Common/number-input.md) control with command binding, validation state, and
field accessibility wired up.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { NumberInputField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <NumberInputField<MyCommand>
        value={c => c.price}
        title='Price'
        prefix='€'
        minimumFractionDigits={2}
        maximumFractionDigits={2}
        min={0}
    />
    <NumberInputField<MyCommand> value={c => c.share} title='Share' suffix='%' min={0} max={100} />
</CommandDialog>;
```

## Choosing between this and NumberField

| Use | When |
| --- | --- |
| [`NumberField`](number-field.md) | A plain numeric entry is enough, and a native `input[type=number]` with the browser's own spinner is what you want. |
| `NumberInputField` | The number is read as a quantity — money, a percentage, a rate — where grouping separators, a fixed decimal precision, or a unit label carry meaning. |

Both bind the same way and default to `0`, so moving between them is a component swap. `NumberField`
is unchanged and keeps its current behavior.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor returning the bound property. Pass the command type as the generic parameter for full type safety. |
| `title` | `string` | — | Field title, used as the control's accessible name. |
| `locale` | `string` | provider locale | BCP 47 locale used for grouping and decimal separators. |
| `minimumFractionDigits` | `number` | — | Minimum fraction digits in the formatted display. |
| `maximumFractionDigits` | `number` | — | Maximum fraction digits in the formatted display. |
| `min` | `number` | — | Minimum allowed value, clamped on commit. |
| `max` | `number` | — | Maximum allowed value, clamped on commit. |
| `step` | `number` | — | Increment for keyboard and stepper interaction. |
| `prefix` | `string` | — | Inline decoration before the value. Never part of the value. |
| `suffix` | `string` | — | Inline decoration after the value. Never part of the value. |
| `placeholder` | `string` | — | Placeholder text shown when the field is empty. |
| `pt` | `NumberInputParts` | — | Per-part attributes for `root`, `input`, `prefix`, and `suffix`. |

## Behavior

- Default value is `0`, and a cleared field commits `0` so the command always carries a number.
- Formatting is presentation only — the command receives the numeric value, never the formatted text.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
- The control exposes `role="spinbutton"` with a formatted `aria-valuetext`, so it renders as
  `input[type=text]` rather than a native numeric spinner.
