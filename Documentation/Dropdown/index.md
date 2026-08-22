# Dropdown

The `Dropdown` component is a curated wrapper around PrimeReact 11's compositional `Select`. It assembles `Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Portal`, `Select.Positioner`, `Select.Popup` and `Select.List` for you, so a select is one element with props instead of seven nested parts.

## Purpose

Dropdown gives you a single-element select that binds a value to a list of options, works inside dialogs without any z-index configuration, and exposes a small, stable prop surface rather than the whole PrimeReact Select API.

## Key Features

- Single or multiple selection (set `multiple`)
- Optional in-popup filter (`filter`) and clear control (`showClear`)
- Portaled and stacked by PrimeReact 11 itself, so it renders above the dialog it was opened from — no manual z-index, no `appendTo`
- `id`, tab order and accessible naming are applied to the focusable combobox trigger, not its layout wrapper
- A small, curated prop surface (below) plus `pt` / `ptOptions` / `unstyled` for full styling control

## Quick Start

```typescript
import { Dropdown } from '@cratis/components/Dropdown';

function MyForm() {
    const [selectedCity, setSelectedCity] = useState(null);

    const cities = [
        { label: 'Oslo', value: 'oslo' },
        { label: 'Bergen', value: 'bergen' },
        { label: 'Trondheim', value: 'trondheim' }
    ];

    return (
        <Dropdown
            value={selectedCity}
            options={cities}
            onChange={(e) => setSelectedCity(e.value)}
            placeholder="Select a City"
            aria-label="City"
        />
    );
}
```

No `optionLabel` / `optionValue` here: when the option objects carry `label` and `value`, those are used — the PrimeReact 10 `Dropdown` convention.

## Props

`Dropdown` exposes a wrapper-owned surface — the common single/multi select props every Cratis form needs — rather than leaking PrimeReact's entire Select API. For anything beyond this, use `pt` / `ptOptions` / `unstyled`.

```typescript
interface DropdownProps<T = unknown> {
    value?: T;
    options?: unknown[];
    optionLabel?: string; // property used as the visible label; defaults to 'label' when the options carry it
    optionValue?: string; // property used as the underlying value; defaults to 'value' when the options carry it
    placeholder?: string;
    filter?: boolean; // filter input inside the popup
    multiple?: boolean; // multi-select
    showClear?: boolean;
    invalid?: boolean;
    disabled?: boolean;
    onChange?: (event: DropdownChangeEvent<T>) => void; // event.value is typed as T
    onBlur?: React.FocusEventHandler<HTMLElement>;
    // styling forwarded to the Select root:
    className?: string;
    style?: React.CSSProperties;
    name?: string;
    // identity and accessibility forwarded to the focusable combobox trigger:
    id?: string;
    tabIndex?: number;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    pt?: SelectRootProps['pt'];
    ptOptions?: SelectRootProps['ptOptions'];
    unstyled?: boolean;
}
```

Every prop is optional. `multiple`, `filter`, `showClear`, `invalid` and `disabled` are simply off unless you set them. The one convention the wrapper applies is `optionLabel` / `optionValue`: when they are omitted and the options are objects carrying a `label` / `value` field, that field is used — as PrimeReact 10's `Dropdown` did. v11's `Select` compares the option object itself against the value otherwise, so `[{ label, value }]` options with a scalar `value` would never match without it. Options keyed differently (`name` / `code`, say) still need `optionLabel` / `optionValue` spelled out.

There is no `...rest` spread and no index signature, so anything not listed above is a compile error rather than an ignored prop. That includes `aria-*` beyond the three declared (`aria-label`, `aria-labelledby`, `aria-describedby`) and PrimeReact Select props the wrapper deliberately does not surface — `appendTo`, `variant`, `size`, `fluid`, `filterMatchMode`, `optionGroupLabel` / `optionGroupChildren`, `optionDisabled`, `open` / `defaultOpen`, and the rest. Reach those through `pt` / `ptOptions` / `unstyled`, or compose `Select` yourself.

`onChange` receives a `DropdownChangeEvent<T>`:

```typescript
interface DropdownChangeEvent<T = unknown> {
    value: T; // the newly selected value (an array when `multiple`)
    originalEvent?: React.SyntheticEvent; // the underlying React event, when available
}
```

## Accessible naming

`Dropdown` places `id`, `tabIndex`, `aria-label`, `aria-labelledby` and `aria-describedby` on the focusable button carrying `role="combobox"`. The outer Select root is only a layout wrapper and does not receive the control id.

Associate a visible label in the normal way:

```tsx
<label htmlFor="role">Role</label>
<Dropdown
    id="role"
    value={role}
    options={roles}
    aria-describedby="role-help"
/>
<span id="role-help">Choose the role used for this assignment.</span>
```

When there is no visible label, provide `aria-label` instead.

## Basic Examples

### Simple String Options

```typescript
const options = ['React', 'Angular', 'Vue', 'Svelte'];

<Dropdown
    value={selectedFramework}
    options={options}
    onChange={(e) => setSelectedFramework(e.value)}
    placeholder="Select Framework"
/>
```

### Object Options

Options shaped `{ label, value }` need nothing more (see the quick start). Any other shape names its fields:

```typescript
const countries = [
    { name: 'Norway', code: 'NO' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Denmark', code: 'DK' }
];

<Dropdown
    value={selectedCountry}
    options={countries}
    onChange={(e) => setSelectedCountry(e.value)}
    optionLabel="name"
    placeholder="Select Country"
/>
```

### With Filtering

Set `filter` to render a filter input inside the popup. The filter input reuses `placeholder` as its own placeholder — there is no separate `filterPlaceholder` prop:

```typescript
<Dropdown
    value={selected}
    options={longListOfOptions}
    onChange={(e) => setSelected(e.value)}
    filter
    placeholder="Select Option"
/>
```

### Clearable Selection

```typescript
<Dropdown
    value={selected}
    options={options}
    onChange={(e) => setSelected(e.value)}
    showClear
    placeholder="Select (optional)"
/>
```

### Multiple Selection

```typescript
<Dropdown<string[]>
    value={selectedTags}
    options={tags}
    onChange={(e) => setSelectedTags(e.value)}
    optionLabel="name"
    optionValue="id"
    multiple
    placeholder="Select tags"
/>
```

## Inside Dialogs

Dropdown works correctly inside dialogs with no configuration:

```typescript
import { Dialog } from '@cratis/components/Dialogs';
import { Dropdown } from '@cratis/components/Dropdown';

<Dialog title="Categorize" visible={visible} onCancel={() => setVisible(false)}>
    <div className="field">
        <label htmlFor="category">Category</label>
        <Dropdown
            id="category"
            value={category}
            options={categories}
            onChange={(e) => setCategory(e.value)}
            placeholder="Select Category"
        />
    </div>
</Dialog>
```

The panel appears above the dialog without z-index issues.

## Overlay stacking inside dialogs

On PrimeReact 10 this needed help. A dropdown panel opened inside a modal dialog rendered _inside_ the dialog's DOM subtree, so the dialog's stacking and scroll context clipped it and the panel could land under the dialog's own mask. Version 2.x of this library carried two workarounds for that: `appendTo={document.body}` on every overlay-bearing field, and a `useOverlayZIndex` hook that raised the panel to a z-index floor with a `MutationObserver`.

**Both are gone in 3.0, because PrimeReact 11 does the work itself.** `Select.Portal` defaults to `appendTo: 'body'`, so the panel is portaled out of the dialog entirely, and the shared z-index registry assigns a later-opened overlay a value above whatever is already registered — so the panel outranks the dialog it was opened from. Measured on PrimeReact 11.1.0: with the dialog positioner at z-index 1102, the select panel opens at 2103, parented directly to `document.body`.

There is nothing to configure and nothing to import. `useOverlayZIndex` no longer exists; if you called it in your own app for your own overlays, check whether v11 has made it unnecessary there too before inlining it.

A regression spec pins this behavior — `Source/Dropdown/for_Dropdown/when_opened_inside_a_dialog.ts` renders a `Dropdown` inside a `Dialog`, opens it, and asserts that the panel is not contained by the dialog popup, that it is portaled to `document.body`, and that its z-index is above the dialog's. If a future PrimeReact release stops portaling or stops stacking the panel, that spec fails — which is exactly the signal that a workaround is needed again.

## Disabled State

```typescript
<Dropdown
    value={selected}
    options={options}
    disabled={isLoading}
    placeholder="Loading..."
/>
```

## Validation and Errors

Use the `invalid` prop to put the trigger into its error state — don't hand-apply a class:

```typescript
<div className="field">
    <label htmlFor="status">Status</label>
    <Dropdown
        id="status"
        value={formData.status}
        options={statusOptions}
        onChange={(e) => setFormData({ ...formData, status: e.value })}
        invalid={!!errors.status}
    />
    {errors.status && <small style={{ color: 'var(--cratis-red-500)' }}>{errors.status}</small>}
</div>
```

Inside a command form, reach for [`DropdownField`](../CommandForm/dropdown-field.md) instead — it wires `invalid`, the error message and the binding for you.

## Complete Form Example

```typescript
import { Dropdown } from '@cratis/components/Dropdown';
import { useState } from 'react';

interface FormData {
    category: string;
    priority: string;
    assignee: string;
}

function IssueForm() {
    const [formData, setFormData] = useState<FormData>({
        category: '',
        priority: '',
        assignee: ''
    });

    const categories = [
        { label: 'Bug', value: 'bug' },
        { label: 'Feature', value: 'feature' },
        { label: 'Improvement', value: 'improvement' }
    ];

    const priorities = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
    ];

    const assignees = [
        { label: 'Alice', value: 'alice' },
        { label: 'Bob', value: 'bob' },
        { label: 'Charlie', value: 'charlie' }
    ];

    return (
        <form>
            <div className="field">
                <label htmlFor="category">Category</label>
                <Dropdown
                    id="category"
                    value={formData.category}
                    options={categories}
                    onChange={(e) => setFormData({ ...formData, category: e.value })}
                    placeholder="Select Category"
                />
            </div>

            <div className="field">
                <label htmlFor="priority">Priority</label>
                <Dropdown
                    id="priority"
                    value={formData.priority}
                    options={priorities}
                    onChange={(e) => setFormData({ ...formData, priority: e.value })}
                    placeholder="Select Priority"
                />
            </div>

            <div className="field">
                <label htmlFor="assignee">Assignee</label>
                <Dropdown
                    id="assignee"
                    value={formData.assignee}
                    options={assignees}
                    onChange={(e) => setFormData({ ...formData, assignee: e.value })}
                    placeholder="Assign to..."
                    showClear
                    filter
                />
            </div>
        </form>
    );
}
```

## Use Cases

- **Form fields**: Select inputs in forms
- **Filters**: Filtering data by category, status, etc.
- **Preferences**: User settings selection
- **Navigation**: Menu-style navigation options
- **Status selection**: Workflow state transitions
- **Type selection**: Choose item types in editors

## Differences from PrimeReact's Select

`primereact/dropdown` no longer exists — PrimeReact 11 renamed it to `primereact/select` and made it **compositional**: you assemble `Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Portal`, `Select.Positioner`, `Select.Popup` and `Select.List` yourself. This wrapper differs from using `Select` directly in two ways:

1. **It is one element, not seven.** The wrapper composes the parts and gates `Select.Filter` and `Select.Clear` on the `filter` / `showClear` props.
2. **It is a curated surface, not a passthrough.** Only the props in the table above are accepted; the rest of PrimeReact's Select API is reachable through `pt` / `ptOptions` / `unstyled`. That is deliberate — it is what lets the wrapper's API stay stable across PrimeReact versions.

Two details of the composition are worth knowing when you style or test it. `onBlur` rides a wrapping `<span>` rather than `Select.Root`, because React blur bubbles as `focusout`. And `placeholder` is not passed to the root — it goes to `Select.Value`, and to the filter input when `filter` is set.

## Best Practices

1. **Provide clear labels**: Always label dropdowns
2. **Use placeholders**: Guide users with meaningful placeholders
3. **Enable filtering for long lists**: Use `filter` prop for 10+ options
4. **Show clear button**: Use `showClear` for optional selections
5. **Validate selections**: Provide error feedback
6. **Disable when appropriate**: Disable during loading or when unavailable
7. **Use object options**: For complex data with multiple properties
8. **Group related options**: Use grouped options for better organization
9. **Provide feedback**: Show loading states, error states clearly

## Accessibility

Inherits PrimeReact Select's accessibility features:

- Keyboard navigation (Arrow keys, Enter, Escape)
- ARIA labels and roles
- Focus management
- Screen reader support

Enhance with:

```typescript
<label htmlFor="dropdown-id">
    Selection Label
</label>
<Dropdown
    id="dropdown-id"
    aria-label="Selection Label"
    // ... other props
/>
```

## Styling

`className` and `style` go to the Select root:

```typescript
<Dropdown
    className="w-full"
    // ...
/>
```

There is no `panelClassName` — the popup is styled through `pt`, whose slot names are PrimeReact's own:

```typescript
<Dropdown
    value={selected}
    options={options}
    onChange={(e) => setSelected(e.value)}
    pt={{
        root: { className: 'w-full' },
        popup: { className: 'custom-dropdown-panel' },
        option: { className: 'px-3 py-2' },
    }}
/>
```

Global CSS is possible too, but outside [PrimeReact's styled mode](../Styling/themed.md) not through `p-*` class names. PrimeReact 11 is unstyled-first: its primitives carry **no `p-*` class at all** unless `styledMode()` hands them PrimeReact's component styles, and parts are identified by data attributes instead:

```css
[data-scope='select'][data-part='root'] {
    /* Custom trigger styles */
}

[data-scope='select'][data-part='popup'] {
    /* Custom panel styles */
}
```

See the [pass-through cheat sheet](../Styling/pass-through.md) for the wrapper-by-wrapper `pt` reference.
