---
title: Stable component parts
description: Customize Components through Cratis-owned parts and state attributes.
---

Every component exposes meaningful elements through `data-cratis-part`. Components that need per-instance customization also accept a `pt` object whose values are ordinary HTML attributes.

```tsx
<Dialog
    title='Edit account'
    pt={{
        backdrop: { className: 'account-dialog-backdrop' },
        root: { className: 'account-dialog' },
        header: { className: 'account-dialog-header' },
        content: { className: 'account-dialog-content' },
        footer: { className: 'account-dialog-footer' },
    }}
>
    Content
</Dialog>
```

`pt` classes merge with the component's structural classes. Named component props control behavior and take precedence over conflicting part attributes.

## CSS targeting

```css
.account-dialog[data-cratis-part='root'] {
    border-radius: 1rem;
}

[data-cratis-part='row'][data-selected='true'] {
    background: var(--product-selected-row);
}
```

Use Cratis part names and state attributes. Do not target React Aria classes or undocumented descendants.

## Common state attributes

- `data-active`
- `data-selected`
- `data-invalid`
- `data-disabled`
- `data-readonly`
- `data-loading`
- `data-position`
- `data-orientation`
- `data-size`
- `data-severity`

## Part groups

| Component       | Stable parts                                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button          | `root`, `icon`, `label`, `spinner`                                                                                                                                            |
| Dialog          | `backdrop`, `positioner`, `root`, `header`, `title`, `close`, `content`, `footer`, `confirm`, `cancel`                                                                        |
| Dropdown        | `root`, `trigger`, `value`, `clear`, `indicator`, `filter`, `popover`, `listbox`, `option`, `multiple`                                                                        |
| DatePickerInput | `root`, `group`, `input`, `segment`, `trigger`, `popover`, `dialog`, `calendar`, `header`, `heading`, `previous`, `next`, `grid`, `cell`, `button-bar`, `today`, `clear`      |
| DataTableCore   | `root`, `search`, `search-input`, `table-container`, `table`, `head`, `header-row`, `header-cell`, `header-content`, `sort`, `body`, `row`, `cell`, `empty-row`, `empty-cell` |
| Stepper         | `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, `panel`                                                                                           |
| Toaster         | `region`, `toast`, `icon`, `content`, `title`, `description`, `action`, `close`                                                                                               |

TypeScript exposes the exact part type for each component, so unknown keys fail compilation.

## Legacy flags

`ptOptions` and `unstyled` remain accepted temporarily for Components 3 source compatibility. They have no effect: Cratis parts always merge, and the component CSS is always consumer-owned.
