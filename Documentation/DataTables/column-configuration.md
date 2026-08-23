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

Set `sortable`. Sorting applies to the currently loaded page. Query-backed complete-result sorting belongs on the server and should be expressed through the Arc paging/sorting contract.

## Column filters

Set `filter` and optionally:

- `filterField` when the filtered path differs from `field`
- `filterPlaceholder`
- `dataType`: `text`, `numeric`, `date`, or `boolean`
- `showFilterMatchModes`
- `filterLabels`
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
    }}
/>
```

A custom editor receives the draft value/mode and `onChange`, `onApply`, and `onClear` callbacks. Applying updates the table's `DataTableFilterMeta`; clearing removes the constraint.

Filtering affects the loaded page. For complete-result filtering, send the filter model as query arguments and filter before server paging.

## Custom matchers

Use `registerDataTableFilterMatcher()` for a named matcher. The returned branded mode can be assigned to `DataTableFilterMeta`, and the registration handle removes it safely.
