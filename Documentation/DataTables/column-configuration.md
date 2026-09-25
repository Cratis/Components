---
title: Column configuration
description: Define data, selection, sorting, filtering, and custom rendering columns.
---

`Column` is a declarative marker consumed by `DataTableCore`, the query-backed table components, and `DataPage.Columns`. It renders nothing on its own; the surrounding table reads its props. Import it from `@cratis/components/DataTables` or, next to `DataPage`, from `@cratis/components/DataPage`.

```tsx
import { DataTableForQuery, Column } from '@cratis/components/DataTables';

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

Nested paths such as `personalDetails.displayName` are resolved by Components. A path that does not exist on the row renders an empty cell. A `null` or `undefined` value also renders empty; any other value is converted with `String(value)`, so format dates, numbers, and objects with `body`.

## Typing fields and cells

`field` is a plain `string`, not a key of your row type, so TypeScript does not catch a misspelled field; the column renders empty cells. Check field names against the read model.

`body` receives the row typed as `unknown` unless you give `Column` a type argument:

```tsx
import { Column } from '@cratis/components/DataTables';
import { type Product } from './Product'; // generated read model

<Column<Product> field='price' header='Price' body={(product) => product.price.toFixed(2)} />;
```

Annotating the parameter, `body={(product: Product) => …}`, works too. When `body` is set, `field` is still used for sorting and filtering, so keep it when the column should stay sortable or filterable.

## Selection

Query-backed tables and `DataPage` use single-row selection by default: every row can be selected by clicking it or pressing Enter or Space, and you track the result through the table's `dataKey`, `selection`, and `onSelectionChange` props. Add a column with `selectionMode='single'` only if you also want a visible radio button in each row. That column renders no data, and its header is named by the provider's `messages.dataTable.selectRow`, then `'Select row'`.

```tsx
<Column selectionMode='single' headerStyle={{ width: '3rem' }} />
```

For bulk actions, set `selectionMode='multiple'` on the table (or `DataPage`) **and** add a column with `selectionMode='multiple'`. The column renders a checkbox in each row and a select-all checkbox in its header; clicking a row or pressing Enter or Space on it also toggles it. Track the set through `selectedItems` and `onSelectedItemsChange`, which receives the full selected set; `onSelectionChange` is not called in this mode.

```tsx
<DataTableForObservableQuery
    query={AllAuthors}
    dataKey='id'
    emptyMessage='No authors'
    selectionMode='multiple'
    selectedItems={selected}
    onSelectedItemsChange={setSelected}
>
    <Column selectionMode='multiple' headerStyle={{ width: '3rem' }} />
    <Column field='name' header='Name' />
</DataTableForObservableQuery>
```

Select-all selects and clears only the rows currently visible after filtering and search, and shows an indeterminate state when some of them are selected. Set `dataKey`: rows are matched by that key, and without it by object identity, so an observable query that replaces its rows on every update loses the selection. The select-all checkbox is named by the table's `selectAllAriaLabel` (on `DataTableCore`), then the provider's `messages.dataTable.selectAllRows`, then `'Select all rows'`; it carries `data-cratis-part='select-all'`.

## Sorting

Set `sortable` for client-side sorting of the currently loaded page. A column is sortable only when it also has a `field`. The header becomes a button that sorts ascending, then descending, on each activation; the sorted header carries `aria-sort`. These table components do not automatically forward sort state to Arc. For complete-result sorting, add explicit sort arguments to the generated query, apply them on the server before paging, and connect the product's sort controls to those arguments.

## Column filters

Set `filter` and optionally:

- `filterField` when the filtered path differs from `field`
- `filterPlaceholder`
- `dataType`: `text`, `numeric`, `date`, or `boolean`
- `showFilterMatchModes`
- `filterLabels`
- `filterPt`
- `filterOptions`
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
built-in English default. The snippet above overrides the defaults; it does not show them. `filterTriggerAriaLabel` is
also available for the trigger button's accessible name. Configure a product's column-filter copy once through the provider
rather than repeating `filterLabels` on every filterable `Column`; use `filterLabels` for a column that genuinely
needs different wording than the rest of the application.

For a column whose values come from a known set, such as a status or a kind, pass `filterOptions`. The filter then offers those values in a dropdown instead of asking the user to type one, and offers only the Equals and Not equals match modes. Each option's `value` is written into the filter constraint, so use the stored value, not the displayed text. `filterOptions` takes precedence over `filterElement`.

```tsx
<Column
    field='status'
    header='Status'
    filter
    filterOptions={[
        { label: 'Open', value: 'open' },
        { label: 'Done', value: 'done' },
    ]}
/>
```

A custom editor (`filterElement`) receives the effective `field`, the draft `value` and `matchMode`, and `onChange`, `onMatchModeChange`, `onApply`, and `onClear` callbacks. Applying updates the table's `DataTableFilterMeta`; clearing removes the constraint.

`filterPt` exposes `trigger`, `popover`, `menu`, `matchMode`, `input`, `actions`, `clear`, and `apply`. These are Cratis-owned parts; the popup/menu/actions also render `data-cratis-part='filter-popover'`, `filter-menu`, and `filter-actions`.

Filtering affects the loaded page. For complete-result filtering, send the filter model as query arguments and filter before server paging.

## Custom matchers

Use `registerDataTableFilterMatcher()` for a named matcher. The returned branded mode can be assigned to `DataTableFilterMeta`, and the registration handle removes it safely. Use `resolveDataTableFilterMatcher(matchMode)` when an application-owned adapter or spec needs to verify the predicate currently installed in the live Components registry.
