---
title: DropdownField
description: Bind a string or number property on an Arc command to a single-select dropdown.
---

`DropdownField` renders the renderer-independent Cratis [`Dropdown`](../Dropdown/index.md) for choosing one value from a list.

## Usage

The excerpt assumes `MyCommand` is a generated command proxy with the bound properties, and `visible` / `setVisible` is component state.

```tsx
import { CommandDialog } from '@cratis/components/CommandDialog';
import { DropdownField } from '@cratis/components/CommandForm';

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
];

<CommandDialog<MyCommand>
    command={MyCommand}
    title='Edit status'
    visible={visible}
    onSuccess={() => setVisible(false)}
    onCancel={() => setVisible(false)}
>
    <DropdownField<MyCommand>
        value={(c) => c.status}
        title='Status'
        options={statusOptions}
        optionLabel='label'
        optionValue='value'
        placeholder='Select a status'
    />
</CommandDialog>;
```

With custom data:

```tsx
const roles = [
    { id: 'admin', display: 'Administrator' },
    { id: 'user', display: 'Standard User' },
];

<DropdownField<MyCommand>
    value={(c) => c.role}
    title='Role'
    options={roles}
    optionLabel='display'
    optionValue='id'
/>;
```

## Props

| Prop                     | Type                                | Default | Description                                                                                                                                                     |
| ------------------------ | ----------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                  | `(instance: TCommand) => unknown`   | —       | **Required.** Accessor function that returns the bound property from the command instance. Pass the command type as the generic parameter for full type safety. |
| `options`                | `Array<{ [key: string]: unknown }>` | —       | **Required.** Array of option objects.                                                                                                                          |
| `optionLabel`            | `string`                            | —       | **Required.** Key in each option object to use as the display label.                                                                                            |
| `optionValue`            | `string`                            | —       | **Required.** Key in each option object to use as the submitted value.                                                                                          |
| `placeholder`            | `string`                            | —       | Placeholder text shown when no value is selected.                                                                                                               |
| `className`              | `string`                            | —       | Extra CSS class combined with the default `w-full`.                                                                                                             |
| `pt`                     | `DropdownParts`                     | —       | Attributes for the Cratis-owned Dropdown's stable parts.                                                                                                        |
| `ptOptions` / `unstyled` | —                                   | —       | Retained temporarily for source compatibility; ignored.                                                                                                         |

`DropdownField` deliberately does not surface `multiple`, `filter` or `showClear` — use [`MultiSelectField`](multi-select-field.md) for multi-select, or the [`Dropdown`](../Dropdown/index.md) wrapper directly outside a command form.

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Shows an empty string while the bound property is unset. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.
