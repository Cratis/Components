---
title: Dropdown selection in React
description: Use Dropdown to control single or multiple selection in React, filter a known set of options, label the field, and localize its action labels.
---

`Dropdown` lets users choose one or several values from a known set of options. Keep the selection in React state and add filtering when users need to type to find a choice.

## Basic selection

Pass the current selection as `value` and write the next value back to state through `onChange`. In this example, choosing Advisor displays that label but stores `'advisor'` in `role`.

```tsx
import { useState } from 'react';
import { Dropdown } from '@cratis/components/Dropdown';

export function RolePicker() {
    const [role, setRole] = useState<string>();

    return (
        <Dropdown
            value={role}
            options={[
                { label: 'Administrator', value: 'admin' },
                { label: 'Advisor', value: 'advisor' },
            ]}
            onChange={setRole}
            aria-label='Role'
        />
    );
}
```

`onChange` receives the selected option's `value` (here `'admin'` or `'advisor'`), not the option object or a DOM event. You can pass a React state setter directly. The optional second argument supplies change metadata with `source: 'user'` and a native event when available. Updating `value` or `options` from your application does not call `onChange`.

Options shaped as `{ label, value }` use those fields automatically. For another object shape, set `optionLabel` to the displayed-text field and `optionValue` to the stored-value field. Primitive options, such as strings, serve as both their own label and value.

The following single-selection examples belong inside a component like `RolePicker`. They reuse `role`, `setRole`, and a `roles` array containing the same `{ label, value }` options.

## Label the control

Give the field a visible label so users can tell what they are choosing before making a selection. Match the label's `htmlFor` to the dropdown's `id`; the same pattern works for the single-select button, filtered input, and multiple-select control:

```tsx
<label htmlFor='project-role'>Project role</label>
<Dropdown id='project-role' value={role} options={roles} onChange={setRole} />
```

The single-select button announces the field label before its selected value, for example, “Project role Advisor.” Filter inputs and native multiple selects also keep the field label as their accessible name. Clicking the label focuses the control.

Labels remain associated when they are inserted, replaced, or reassociated after mounting. A label without an `id` receives a stable generated one; existing IDs are preserved, and generated IDs do not depend on label order. The shared label observer disconnects when the last Dropdown in that DOM root unmounts.

Explicit `aria-labelledby` or `aria-label` props take precedence over automatic native-label discovery. For an accessible name in server-rendered HTML before hydration, provide the label reference explicitly:

```tsx
<label id='project-role-label' htmlFor='project-role'>Project role</label>
<Dropdown
    id='project-role'
    aria-labelledby='project-role-label'
    value={role}
    options={roles}
    onChange={setRole}
/>
```

## Filtered selection

Add `filter` to let users type to narrow the supplied options. `filterPlaceholder` sets the input hint independently of the empty-selection `placeholder`.

```tsx
<Dropdown
    value={role}
    options={roles}
    filter
    placeholder='Select a role'
    filterPlaceholder='Search roles'
    onChange={setRole}
    aria-label='Role'
/>
```

Clicking an option or pressing Enter on a highlighted option reports its value through `onChange` once and closes the list. Enter commits nothing when no option is highlighted. Dropdown closes and clears stale filter text even if your handler has not supplied a new value; a later controlled `value` takes precedence.

Filtered selection follows the combobox pattern: a text input controls an options list. A non-filtered single select uses a button that opens a listbox. Query by accessible name in tests rather than assuming `role="combobox"` for both.

## Multiple selection

Set `multiple` and use an array for both the controlled value and the `Dropdown<T>` type. The callback receives the complete next array, so replace the state with it rather than appending each callback value.

Using the same imports as `RolePicker`:

```tsx
export function MultipleRolePicker() {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    return (
        <>
            <label htmlFor='project-roles'>Project roles</label>
            <Dropdown<string[]>
                id='project-roles'
                multiple
                filter
                showClear
                value={selectedRoles}
                options={[
                    { label: 'Administrator', value: 'admin' },
                    { label: 'Advisor', value: 'advisor' },
                ]}
                placeholder='Select roles'
                filterPlaceholder='Search roles'
                onChange={setSelectedRoles}
            />
        </>
    );
}
```

Selecting both options stores `['admin', 'advisor']`; clearing stores `[]`. The filtered control keeps the selected labels visible while the list is closed. Remove `filter` for a native multiple select instead of a searchable popup. Dropdown does not provide virtualized search or chip collapsing.

## Localizing show-options and clear-selection

Supply translated option labels, field labels, and placeholders in your application. Changing the provider's `locale` does not translate those strings or the Cratis-owned action labels for you.

Set shared action text through [`CratisComponentsProvider`](../Common/cratis-components-provider.md): `messages.dropdown.showOptions` names the filtered control's open-options button, and `messages.dropdown.clearSelection` names the clear button. Their English defaults are `'Show options'` and `'Clear selection'`.

For one field, use `pt.trigger['aria-label']` to override the open-options label or `pt.clear['aria-label']` to override the clear label. The legacy `pt.select['aria-label']` also supplies the open-options label when no trigger override exists. Each part override takes precedence over its provider message.

This example shows a field-specific open-options label. Keep the `onChange={setRole}` binding when applying these props to the controlled example. Because `showClear` emits `null` for single selection, include `null` in that field's state type, such as `useState<string | null>(null)`.

```tsx
<Dropdown
    value={role}
    options={roles}
    filter
    showClear
    aria-label='Role'
    pt={{ trigger: { 'aria-label': 'Show role options' } }}
/>
```

## Props

| Prop                               | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| `value`                            | Selected value or array for multiple selection. |
| `options`                          | Primitive or object options.                    |
| `optionLabel` / `optionValue`      | Display and stored-value fields; detects `label` and `value` by default. |
| `placeholder`                      | Empty trigger text.                             |
| `filter` / `filterPlaceholder`     | Searchable combobox mode.                       |
| `multiple`                         | Array selection; native without `filter`, searchable with it. |
| `showClear`                        | Clear action; emits `null` for single selection or `[]` for multiple selection. |
| `invalid` / `disabled`             | Control state.                                  |
| `className` / `style`              | Class and inline style for the outer wrapper.   |
| `id`, `name`, `tabIndex`, `aria-*` | Identity, form, and accessibility attributes.   |
| `onChange` / `onBlur`              | Next-value callback with optional metadata, and focus callback. |
| `pt`                               | Cratis-owned stable part attributes.            |

## Stable parts

`root`, `input`, `select`, `trigger`, `value`, `clear`, `indicator`, `filter`, `popover`, `listbox`, `option`, and `multiple`.

The popup is portaled outside modal clipping contexts and carries a z-index above Cratis dialogs. Use the `--cratis-*` tokens and stable parts to style it without renderer selectors. Follow the [pass-through guide](../Styling/pass-through.md) to customize part attributes.
