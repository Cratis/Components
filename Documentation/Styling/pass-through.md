---
title: Stable component parts
description: Customize Components through typed Cratis part keys and documented DOM part values.
---

Components exposes two related styling surfaces:

- **Typed `pt` keys** use camel case and accept ordinary HTML attributes for one component instance.
- **DOM part values** appear in `data-cratis-part` and use kebab case where a name contains several words.

They are documented separately because not every DOM part needs a `pt` key, and the spellings are intentionally different (`headerRow` versus `header-row`).

## Typed pt keys

```tsx
<Dialog
    title='Edit account'
    pt={{
        backdrop: { className: 'account-dialog-backdrop' },
        root: { className: 'account-dialog' },
        content: { className: 'account-dialog-content' },
    }}
>
    Content
</Dialog>
```

| Component/type                         | Typed `pt` keys                                                                                                                                                                        | Element types                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `ButtonParts`                          | `root`, `icon`, `label`, `spinner`                                                                                                                                                     | button, spans                                                 |
| `DialogParts`                          | `backdrop`, `positioner`, `root`, `header`, `title`, `close`, `content`, `footer`, `confirm`, `cancel`                                                                                 | divs/header/heading/footer/buttons                            |
| `DropdownParts`                        | `root`, `input`, `select`, `trigger`, `value`, `clear`, `indicator`, `popover`, `listbox`, `option`, `filter`, `multiple`                                                              | wrapper, input/button, spans, popover/listbox/options, select |
| `DatePickerInputPassThrough`           | `root`, `group`, `input`, `placeholder`, `segment`, `trigger`, `popover`, `dialog`, `calendar`, `header`, `heading`, `previous`, `next`, `grid`, `cell`, `buttonBar`, `today`, `clear` | divs, segmented field, buttons, calendar grid/cells           |
| `DataTableParts`                       | `root`, `search`, `searchInput`, `tableContainer`, `table`, `head`, `headerRow`, `headerCell`, `body`, `row`, `cell`, `emptyRow`, `emptyCell`                                          | div/input/table sections/rows/cells                           |
| `ColumnFilterMenuParts` (`Column.filterPt`) | `trigger`, `popover`, `menu`, `matchMode`, `input`, `actions`, `clear`, `apply`                                                                                             | button, overlay/menu, inputs, actions                         |
| `TablePaginatorParts`                  | `root`, `range`, `info`, `first`, `previous`, `next`, `last`                                                                                                                           | navigation div, spans, and Button parts                       |
| `StepperParts`                         | `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, `panel`                                                                                                    | div, ordered list, list item, button, spans, section          |
| `ToasterPassThrough`                   | `region`, `toast`, `icon`, `content`, `title`, `description`, `close`, `action`                                                                                                        | region/article/divs/spans/buttons                             |
| `ToolbarParts` / `ToolbarButtonParts`  | toolbar `root`; button `root`, `icon`, `label`                                                                                                                                         | toolbar div and native buttons/spans                          |
| `ToolbarFanOutParts`                   | `root`, `trigger`, `panel`                                                                                                                                                             | fan-out divs and native trigger                              |
| `ActionMenubar` `pt`                   | the `ButtonParts` keys applied to each action                                                                                                                                          | button and spans                                              |
| Query table / `DataPage` `paginatorPt` | `TablePaginatorParts`                                                                                                                                                                  | paginator surface                                             |
| `DataPage` `tablePt`                   | `DataTableParts`                                                                                                                                                                       | table surface                                                 |
| `DataPage` `menubarPt`                 | `ButtonParts`                                                                                                                                                                          | action buttons                                                |

Command field part keys:

| Field                  | Typed keys                                    |
| ---------------------- | --------------------------------------------- |
| InputText / TextArea   | `root`                                        |
| Number                 | `root`, `input`                               |
| Checkbox               | `root`, `input`, `box`, `indicator`           |
| ToggleSwitch           | `root`, `input`, `control`, `handle`          |
| Password               | `root`, `input`, `toggle`                     |
| RadioButton            | `root`, `input`, `box`, `indicator`           |
| RadioGroup             | `root`, `option`, `input`, `box`, `indicator` |
| Slider                 | `root`, `input`, `value`                      |
| Chips                  | `root`, `item`, `remove`, `input`             |
| ColorPicker            | `root`, `input`, `value`                      |
| Rating                 | `root`, `option`, `input`, `star`             |
| Calendar               | `DatePickerInputPassThrough` keys             |
| Dropdown / MultiSelect | `DropdownParts` keys                          |

Named behavior props override conflicting part attributes. Part classes and styles merge with component structure. `DropdownParts.input` and `select` are narrow Components 3 migration aliases for class, style, id, and ARIA values; attach event handlers and other ordinary attributes to the current `trigger`, `filter`, `multiple`, `listbox`, or `option` part instead.

## DOM part values

Use the exact kebab-case value in CSS or tests:

| Surface        | `data-cratis-part` values                                                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button         | `root`, `icon`, `label`, `spinner`                                                                                                                                                              |
| Dialog         | `backdrop`, `positioner`, `root`, `header`, `title`, `close`, `content`, `footer`, `confirm`, `cancel`                                                                                          |
| Dropdown       | `root`, `trigger`, `value`, `clear`, `indicator`, `filter`, `popover`, `listbox`, `option`, `multiple`                                                                                          |
| DatePicker     | `root`, `group`, `input`, `placeholder`, `segment`, `trigger`, `popover`, `dialog`, `calendar`, `header`, `heading`, `previous`, `next`, `grid`, `cell`, `button-bar`, `today`, `clear`         |
| DataTable      | `root`, `search`, `search-input`, `table-container`, `table`, `head`, `header-row`, `header-cell`, `header-content`, `sort`, `filter-trigger`, `filter-popover`, `filter-menu`, `filter-actions`, `body`, `row`, `cell`, `empty-row`, `empty-cell` |
| TablePaginator | `root`, `range`, `info`; paginator buttons expose the documented Button parts                                                                                                                   |
| Stepper        | `root`, `list`, `step`, `header`, `number`, `title`, `separator`, `panels`, `panel`                                                                                                             |
| Toaster        | `region`, `toast`, `icon`, `content`, `title`, `description`, `action`, `close`                                                                                                                 |
| Tooltip        | `trigger`, `popup`                                                                                                                                                                              |
| Command fields | `root`, plus the typed field-specific values listed above (`input`, `textarea`, `box`, `control`, `handle`, `indicator`, `option`, `item`, `remove`, `value`, `star`, `toggle`)                 |
| Display        | component roots plus `image`, `fallback`, `remove`, `indicator`, `range`, `track`, and labels where applicable                                                                                  |
| Event timeline | `timeline`, `event`, `separator`, `marker`, `connector`, `content`                                                                                                                              |
| Toolbar        | `root`, `button`, `icon`, `label`, `fanout-root`, `fanout-trigger`, `fanout-panel`                                                                                                            |

`header-content`, `sort`, and `filter-trigger` are DOM targets but are not `DataTableParts` keys. Customize them with CSS rather than claiming a nonexistent typed key.

```css
[data-cratis-part='header-cell'] {
    text-transform: uppercase;
}

[data-cratis-part='row'][data-selected='true'] {
    background: var(--product-selected-row);
}
```

## State attributes

State attributes are component-specific. Common values include:

| Attribute          | Meaning                                |
| ------------------ | -------------------------------------- |
| `data-active`      | Active filter, step, or action.        |
| `data-selected`    | Selected row, option, or value.        |
| `data-invalid`     | Validation error state.                |
| `data-disabled`    | Disabled component state.              |
| `data-readonly`    | Read-only date/control state.          |
| `data-loading`     | Loading toast/action.                  |
| `data-position`    | Overlay, timeline, or region position. |
| `data-orientation` | Horizontal/vertical layout.            |
| `data-size`        | Component size variant.                |
| `data-severity`    | Semantic status tone.                  |

Do not assume an attribute exists on every component; use its documented parts/type and inspect the rendered Cratis contract in tests.

## Legacy flags

`ptOptions` and `unstyled` remain accepted temporarily for Components 3 source compatibility. They have no effect: typed Cratis attributes always merge, and styling is always CSS-owned.
