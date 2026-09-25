---
title: RatingField
description: Bind a number property on an Arc command to a star-rating radio group.
---

`RatingField` provides a Cratis-owned star-rating radio group with labeled options bound to a `number` property.

## Usage

The excerpt assumes `SubmitReview` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { RatingField } from '@cratis/components/CommandForm';

<CommandDialog<SubmitReview>
    command={SubmitReview}
    title='Review'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <RatingField<SubmitReview> value={(c) => c.rating} title='Rating' stars={5} />
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

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows `0` (no rating selected) while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The bound value is the selected star count (`1`–`stars`).
- Stars use native arrow-key radio navigation with one tab stop.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
