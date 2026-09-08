---
title: Column configuration
description: Define data, selection, sorting, filtering, and custom rendering columns.
---

`Column` is a declarative marker consumed by `DataTableCore` and the query-backed table components.

```tsx
<DataTableForQuery query={AllAuthors} emptyMessage='No authors'>
    <Column field='name' header='Name' sortable filter />
    <Column field='email' header='Email' filter />
</DataTableForQuery>
```

## Data and custom cells

| Prop                              | Purpose                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `field`                           | Dot-separated row path used for display, sorting, and default filtering. |
| `header`                          | Header content.                                                          |
| `body`                            | Custom cell renderer receiving the row.                                  |
| `style` / `className`             | Body-cell treatment.                                                     |
| `headerStyle` / `headerClassName` | Header-cell treatment.                                                   |
| `bodyStyle` / `bodyClassName`     | Body-only override.                                                      |

Nested paths such as `personalDetails.displayName` are resolved by Components.

## Selection

Set `selectionMode='single'` on a selection column and configure the table's `dataKey`, `selection`, and `onSelectionChange` props.

## Sorting

Set `sortable` for client-side sorting of the currently loaded page. These table components do not automatically forward sort state to Arc. For complete-result sorting, add explicit sort arguments to the generated query, apply them on the server before paging, and connect the product's sort controls to those arguments.

## Column filters

Set `filter` and optionally:

- `filterField` when the filtered path differs from `field`
- `filterPlaceholder`
- `dataType`: `text`, `numeric`, `date`, or `boolean`
- `showFilterMatchModes`
- `filterLabels`
- `filterPt`
- `filterElement`

```tsx
<Column
    field='status'
    header='Status'
    filter
    dataType='boolean'
    filterLabels={{
        clear: 'Reset',
        apply: 'Use filter',
        true: 'Active',
        false: 'Inactive',
        matchModeAriaLabel: 'Comparison',
        valueAriaLabel: (field) => `Value for ${field}`,
        matchModeLabel: (_mode, defaultLabel) => defaultLabel,
    }}
/>
```

Every label in `filterLabels` resolves with the same precedence: the `filterLabels` entry wins, then the matching
[`CratisComponentsProvider`](../Common/cratis-components-provider.md) `messages.columnFilter` message, then the
English default shown in the snippet above. Configure a product's column-filter copy once through the provider
rather than repeating `filterLabels` on every filterable `Column`; use `filterLabels` for a column that genuinely
needs different wording than the rest of the application.

A custom editor receives the draft value/mode and `onChange`, `onApply`, and `onClear` callbacks. Applying updates the table's `DataTableFilterMeta`; clearing removes the constraint.

`filterPt` exposes `trigger`, `popover`, `menu`, `matchMode`, `input`, `actions`, `clear`, and `apply`. These are Cratis-owned parts; the popup/menu/actions also render `data-cratis-part='filter-popover'`, `filter-menu`, and `filter-actions`.

Filtering affects the loaded page. For complete-result filtering, send the filter model as query arguments and filter before server paging.

## Custom matchers

Use `registerDataTableFilterMatcher()` for a named matcher. The returned branded mode can be assigned to `DataTableFilterMeta`, and the registration handle removes it safely. Use `resolveDataTableFilterMatcher(matchMode)` when an application-owned adapter or spec needs to verify the predicate currently installed in the live Components registry.
