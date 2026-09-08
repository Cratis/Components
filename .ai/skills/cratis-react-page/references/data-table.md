# Data Tables — Reference

Use standalone data tables when a query-backed table is needed without `DataPage` page chrome. Import both tables and `Column` from the explicit DataTables subpath.

## Snapshot query

```tsx
import { DataTableForQuery, Column } from '@cratis/components/DataTables';
import { AllAccounts } from './AllAccounts';

<DataTableForQuery query={AllAccounts} emptyMessage="No accounts">
    <Column field="name" header="Name" sortable />
    <Column field="balance" header="Balance" />
</DataTableForQuery>
```

## Observable query

```tsx
import {
    DataTableForObservableQuery,
    Column,
} from '@cratis/components/DataTables';
import { AllAccountsLive } from './AllAccountsLive';

<DataTableForObservableQuery
    query={AllAccountsLive}
    emptyMessage="No accounts">
    <Column field="name" header="Name" sortable />
    <Column field="balance" header="Balance" />
</DataTableForObservableQuery>
```

## Shared props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | generated query class | ✓ | Snapshot or observable query matching the chosen component |
| `emptyMessage` | `string` | ✓ | Message shown when no rows are returned |
| `children` | `ReactNode` | | `<Column>` markers describing visible columns |
| `queryArguments` | query argument object | | Arguments forwarded to the generated query |
| `selection` | row, `null`, or `undefined` | | Controlled/current selection |
| `onSelectionChange` | `(event: DataTableSelectionChangeEvent<T>) => void` | | Selection callback; selected row is `event.value` |
| `dataKey` | `string` | | Stable row identity field |
| `globalFilterFields` | `string[]` | | Fields searched within the currently loaded page |
| `defaultFilters` | `DataTableFilterMeta` | | Initial loaded-page filters |
| `className` / `pt` | styling hooks | | Root class and stable Cratis table parts |
| `paginatorClassName` / `paginatorPt` | styling hooks | | Paginator class and parts |

## Column definition

`Column` is a marker component. Common props include:

- `field`, `header`, and optional `body` cell renderer;
- `sortable`;
- `filter`, `filterField`, `filterPlaceholder`, and `dataType`;
- `selectionMode="single"`;
- cell/header class, style, and part customization.

```tsx
<Column
    field="balance"
    header="Balance"
    sortable
    body={(account) => account.balance.toFixed(2)}
/>
```

## Choose the surface

| Situation | Component |
| --- | --- |
| Full page with actions/details | `DataPage` |
| Embedded snapshot table | `DataTableForQuery` |
| Embedded real-time table | `DataTableForObservableQuery` |
| Already-loaded inline rows | `DataTableCore` |

Filtering and sorting apply to the currently loaded page. Complete-result filtering/sorting belongs in server query arguments before paging.
