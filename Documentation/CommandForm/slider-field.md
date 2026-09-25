---
title: SliderField
description: Bind a number property on an Arc command to a native range input.
---

`SliderField` renders a Cratis-owned native range input for selecting a numeric value. The current value is displayed below the slider.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { SliderField } from '@cratis/components/CommandForm';

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit levels'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <SliderField<MyCommand> value={c => c.volume} title="Volume" min={0} max={100} step={5} />
    <SliderField<MyCommand> value={c => c.experience} title="Years of experience" min={0} max={50} />
</CommandDialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `(instance: TCommand) => unknown` | — | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `min` | `number` | `0` | Minimum value. |
| `max` | `number` | `100` | Maximum value. |
| `step` | `number` | `1` | Step increment. |

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows `0` while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The slider spans full width within its container.
- The selected numeric value is rendered centered beneath the slider track.
