---
title: DropdownField
description: DropdownField in Cratis Components binds an Arc command's string or number to one option, using configurable option labels and value keys.
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

The accessor selects a command member in the surrounding dialog or Arc `CommandForm`. Bind a single string or number, not the option object. `optionLabel` and `optionValue` name properties on each option object; they do not transform the command value.

In the core Dropdown renderer, a selection resolves back to the configured option value and writes that primitive unchanged. Selection matching uses `Object.is`: the number `1` does not match the string `'1'`. Keep values unique and use the same primitive type in your options and command. The field's string-or-number cast does not parse numeric strings.

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

`DropdownField` deliberately does not surface `multiple`, `filter` or `showClear` — use [`MultiSelectField`](multi-select-field.md) for multi-select, or the [`Dropdown`](../Dropdown/index.md) wrapper directly outside a command form. It also does not declare or forward top-level `disabled` or `readOnly` props. A disabled button part is not a whole-widget disabled contract; do not treat it as an authorization boundary.

Every field also accepts Arc's shared field props, such as `title`, `description`, `initialValue`, and `noInitialValue`, and the accessibility props `id`, `aria-label`, and `aria-describedby`. See [Accessible names and validation errors](index.md#accessible-names-and-validation-errors).

## Behavior

- Uses an empty-string display fallback when the bound property is `undefined`; it does not initialize the command. See [Field defaults and command values](index.md#field-defaults-and-command-values).
- The field spans full width within its container.
- Validation state is reflected through `aria-invalid` and `data-invalid`.

A placeholder is not a selected command value. Seed an initial choice through `initialValues`, or use `currentValues` for a choice the parent keeps changing; see [Initialize command values](../CommandDialog/index.md#initialize-command-values). An unmatched command value can leave no matching option displayed: the core renderer does not automatically select the first option or clear that value from the command.

The field passes its accessible name, error descriptions and invalid state to Dropdown. The [Dropdown parts reference](../Dropdown/index.md) covers trigger/popover styling and the legacy `pt.input` alias; `ptOptions` and `unstyled` do not select a different styling system. Dropdown uses the `dropdown.select` renderer slot, with a React Aria core implementation. Keep command values as strings or numbers rather than copying that implementation's internal selection keys; an optional renderer does not change the field's binding API.
