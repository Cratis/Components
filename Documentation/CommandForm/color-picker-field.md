# ColorPickerField

`ColorPickerField` wraps the PrimeReact `ColorPicker` component for selecting colors.

## Usage

```tsx
import { CommandDialog } from '@cratis/components';
import { ColorPickerField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onHide={() => setVisible(false)}>
    <ColorPickerField<MyCommand>
        value={c => c.primaryColor}
        title="Primary color"
    />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | - | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `inline` | `boolean` | `false` | Renders the picker inline instead of using an overlay. |
| `defaultColor` | `string` | `ff0000` | Fallback color shown by PrimeReact when the bound value is empty. |

## Behavior

- Default value is an empty string.
- Values are persisted as color strings (hex format in the default PrimeReact mode).
- Validation state is reflected by applying the `p-invalid` class when the field is invalid.
