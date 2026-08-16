# ChipsField

`ChipsField` wraps the PrimeReact `InputTags` component (`primereact/inputtags` — v10's `Chips`) for collecting multiple text values in a single field.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { ChipsField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <ChipsField<MyCommand>
        value={c => c.tags}
        placeholder="Add tags and press Enter"
        addOnBlur
    />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | - | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder` | `string` | - | Advisory text shown when no chip values exist. |
| `max` | `number` | - | Maximum number of chips allowed. |
| `separator` | `string` | - | **No effect.** See below. |
| `addOnBlur` | `boolean` | `false` | Adds the current input as a chip when the field loses focus. |
| `allowDuplicate` | `boolean` | `true` | Controls whether duplicate chip values are allowed. |
| `removeAriaLabel` | `string` | `'Remove'` | Accessible name for each chip's remove button. Override to localize. |
| `className` | `string` | - | Extra CSS class combined with the default `w-full`. |
| `pt` / `ptOptions` / `unstyled` | - | - | Pass-through styling for the underlying `InputTags`. |

## Behavior

- Default value is an empty array.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.

> [!IMPORTANT]
> **`separator` no longer does anything.** PrimeReact 11's `InputTags` commits one tag per Enter and does not auto-split pasted input, so v10 `Chips`' `separator` has no equivalent. The prop is still accepted so existing call sites compile — remove it, and split multi-value input yourself before binding if you need that behavior.
