# ChipsField

`ChipsField` renders a Cratis-owned token input for collecting multiple text values.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { ChipsField } from '@cratis/components/CommandForm';

<CommandDialog command={MyCommand} visible={visible} onCancel={() => setVisible(false)}>
    <ChipsField<MyCommand>
        value={(c) => c.tags}
        placeholder='Add tags and press Enter'
        addOnBlur
    />
</CommandDialog>;
```

## Props

| Prop                            | Type                              | Default    | Description                                                                                                                                                     |
| ------------------------------- | --------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                         | `(instance: TCommand) => unknown` | -          | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `placeholder`                   | `string`                          | -          | Advisory text shown when no chip values exist.                                                                                                                  |
| `max`                           | `number`                          | -          | Maximum number of chips allowed.                                                                                                                                |
| `separator`                     | `string`                          | -          | Splits the draft on this literal string when the value is committed.                                                                                            |
| `addOnBlur`                     | `boolean`                         | `false`    | Adds the current input as a chip when the field loses focus.                                                                                                    |
| `allowDuplicate`                | `boolean`                         | `false`    | Controls whether duplicate chip values are allowed.                                                                                                             |
| `removeAriaLabel`               | `string \| (item, index) => string` | `Remove <item>` | Accessible name for remove buttons. Use a callback for localized item-specific labels.                                                                     |
| `className`                     | `string`                          | -          | Extra CSS class combined with the default `w-full`.                                                                                                             |
| `pt` / `ptOptions` / `unstyled` | -                                 | -          | Stable Cratis chip/item/remove/input parts; compatibility flags are no-ops.                                                                                      |

## Behavior

- Default value is an empty array.
- Enter commits the current draft; `addOnBlur` can also commit when focus leaves the field.
- Candidates are trimmed and empty candidates are ignored.
- With `allowDuplicate={false}`, duplicates are removed against both existing values and other candidates in the same draft **before** `max` is applied. An existing duplicate therefore cannot consume the final slot ahead of a later unique value.
- With `allowDuplicate`, repeated values are preserved until `max` is reached.
- Each remove action defaults to the item-specific accessible name `Remove <item>`; localize it with the callback form of `removeAriaLabel`.
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.

> [!IMPORTANT]
> `separator` is treated as a literal string. The draft is split on that string when the user commits it; it is not interpreted as a regular expression.
