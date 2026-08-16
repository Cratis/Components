# RatingField

`RatingField` provides a star-rating input backed by the PrimeReact `Rating` component, bound to a `number` property on a command.

## Usage

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RatingField } from '@cratis/components/CommandForm';

<CommandDialog command={SubmitReview} visible={visible} onCancel={() => setVisible(false)}>
    <RatingField<SubmitReview> value={c => c.rating} stars={5} />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `stars` | `number` | `5` | Number of stars to display. |
| `starAriaLabel` | `(starValue: number) => string` | `"1 star"`, `"2 stars"`, … | Builds the accessible name for each star, from the 1-based star value. Override to localize. |
| `className` | `string` | — | Extra CSS class name. |
| `pt` | `RatingRootProps['pt']` | — | PrimeReact pass-through configuration. |
| `ptOptions` | `RatingRootProps['ptOptions']` | — | PrimeReact pass-through options. |
| `unstyled` | `boolean` | `false` | Disables every base PrimeReact style on the underlying `Rating`. |

## Behavior

- Default value is `0` (no rating selected).
- The bound value is the selected star count (`1`–`stars`).
- Validation state is reflected via the PrimeReact `invalid` flag.
