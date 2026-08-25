# RatingField

`RatingField` provides a Cratis-owned accessible star-rating radio group bound to a `number` property.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RatingField } from '@cratis/components/CommandForm';

<CommandDialog
    command={SubmitReview}
    visible={visible}
    onCancel={() => setVisible(false)}
>
    <RatingField<SubmitReview> value={(c) => c.rating} stars={5} />
</CommandDialog>;
```

## Props

| Prop            | Type                              | Default                    | Description                                                                                                                                            |
| --------------- | --------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`         | `(instance: TCommand) => unknown` | —                          | **Required.** Accessor that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `stars`         | `number`                          | `5`                        | Number of stars to display.                                                                                                                            |
| `name`          | `string`                          | generated                  | Optional native radio-group name. Every star in the component shares one name.                                                                         |
| `starAriaLabel` | `(starValue: number) => string`   | `"1 star"`, `"2 stars"`, … | Builds the accessible name for each star, from the 1-based star value. Override to localize.                                                           |
| `className`     | `string`                          | —                          | Extra CSS class name.                                                                                                                                  |
| `pt`            | component-specific parts          | —                          | Cratis-owned HTML attributes for stable parts.                                                                                                         |
| `ptOptions`     | `object`                          | —                          | Legacy compatibility prop; ignored.                                                                                                                    |
| `unstyled`      | `boolean`                         | `false`                    | Legacy compatibility prop; ignored.                                                                                                                    |

## Behavior

- Default value is `0` (no rating selected).
- The bound value is the selected star count (`1`–`stars`).
- Stars use native arrow-key radio navigation with one tab stop.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
