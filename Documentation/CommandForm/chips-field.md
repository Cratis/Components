# ChipsField

`ChipsField` wraps the PrimeReact `Chips` component for collecting multiple text values in a single field.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { ChipsField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <ChipsField<MyCommand>
        value={c => c.tags}
        placeholder="Add tags and press Enter"
        separator=","
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
| `separator` | `string` | - | Adds a chip when the separator character is typed. |
| `addOnBlur` | `boolean` | `false` | Adds the current input as a chip when the field loses focus. |
| `allowDuplicate` | `boolean` | `true` | Controls whether duplicate chip values are allowed. |

## Behavior

- Default value is an empty array.
- The field spans full width within its container.
- Validation state is reflected via the PrimeReact `invalid` flag.
