---
title: Dropdown
description: Single, filtered, and multiple selection with documented names, roles, and a stable Cratis API.
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
    onChange={setRole}
    aria-label='Role'
/>
```

When option objects contain `label` and `value`, those fields are used automatically. Use `optionLabel` and `optionValue` for another shape.

## Label the control

An external native label associates with the primary button, filter input, or multiple-select control through `htmlFor` and the Dropdown's `id`:

```tsx
<label htmlFor='project-role'>Project role</label>
<Dropdown id='project-role' value={role} options={roles} onChange={setRole} />
```

The single-select button announces the field label before its selected value (for example, “Project role Developer”), rather than announcing only “Developer.” Filter inputs and native multiple selects retain the field label as their accessible name. A label without an `id` receives a stable generated one after mounting; existing label IDs are preserved. Clicking the label still focuses the control. Independently inserted, replaced, or reassociated labels stay synchronized after mounting; generated IDs do not depend on a label's position. A shared observer watches only potential label-association changes and disconnects when the last Dropdown in that DOM root unmounts.

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

Filtered selection follows the combobox pattern. A non-filtered single select follows the button/listbox pattern, so tests should query by accessible name rather than assume `role="combobox"` for both.

## Multiple selection

Set `multiple` and bind an array. Components uses native multiple selection when filtering is off and an accessible multi-value combobox when `filter` is enabled. Use a specialized collection picker when a large dataset needs virtualized search or chip collapsing.

## Localizing show-options and clear-selection

The show-options trigger (the filtered combobox path) and the clear-selection action (`showClear`) carry
their own accessible names, resolved with the same precedence everywhere `Dropdown` renders them: `pt.trigger['aria-label']`
(or `pt.select['aria-label']` for the trigger) wins, then the [`CratisComponentsProvider`](../Common/cratis-components-provider.md)'s
`messages.dropdown.showOptions` / `messages.dropdown.clearSelection`, then the English defaults `'Show options'` /
`'Clear selection'`. Configure them once for every `Dropdown` in the application through the provider, or per instance
through `pt`.

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

`root`, `input`, `select`, `trigger`, `value`, `clear`, `indicator`, `filter`, `popover`, `listbox`, `option`, and `multiple`.

The popup is portaled outside modal clipping contexts and carries a z-index above Cratis dialogs. Styling uses the `--cratis-*` tokens and stable parts; no renderer selectors are required.
