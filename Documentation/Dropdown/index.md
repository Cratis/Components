---
title: Dropdown
description: Accessible single, filtered, and multiple selection with a stable Cratis API.
---

`Dropdown` binds a value to an option collection without exposing its internal interaction library.

## Basic selection

```tsx
<Dropdown
    value={role}
    options={[
        { label: 'Administrator', value: 'admin' },
        { label: 'Advisor', value: 'advisor' },
    ]}
    onChange={(event) => setRole(event.value)}
    aria-label='Role'
/>
```

When option objects contain `label` and `value`, those fields are used automatically. Use `optionLabel` and `optionValue` for another shape.

## Filtered selection

```tsx
<Dropdown
    value={role}
    options={roles}
    filter
    placeholder='Select a role'
    filterPlaceholder='Search roles'
    onChange={(event) => setRole(event.value)}
    aria-label='Role'
/>
```

Filtered selection follows the combobox pattern. A non-filtered single select follows the button/listbox pattern, so tests should query by accessible name rather than assume `role="combobox"` for both.

## Multiple selection

Set `multiple` and bind an array. Components uses the native multiple-select path for dependable keyboard and screen-reader behavior. Use a specialized collection picker when a large dataset needs virtualized search or chip collapsing.

## Props

| Prop                               | Purpose                                         |
| ---------------------------------- | ----------------------------------------------- |
| `value`                            | Selected value or array for multiple selection. |
| `options`                          | Option collection.                              |
| `optionLabel` / `optionValue`      | Field names for object options.                 |
| `placeholder`                      | Empty trigger text.                             |
| `filter` / `filterPlaceholder`     | Searchable combobox mode.                       |
| `multiple`                         | Native multiple-selection mode.                 |
| `showClear`                        | Clear action for a single selection.            |
| `invalid` / `disabled`             | Control state.                                  |
| `id`, `name`, `tabIndex`, `aria-*` | Identity, form, and accessibility attributes.   |
| `onChange` / `onBlur`              | Selection and focus callbacks.                  |
| `pt`                               | Cratis-owned stable part attributes.            |

## Stable parts

`root`, `trigger`, `value`, `clear`, `indicator`, `filter`, `popover`, `listbox`, `option`, and `multiple`.

The popup is portaled outside modal clipping contexts and carries a z-index above Cratis dialogs. Styling uses the `--cratis-*` tokens and stable parts; no renderer selectors are required.
