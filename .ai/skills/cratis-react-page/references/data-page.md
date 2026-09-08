# DataPage — Reference

`DataPage` is the standard full-page list layout. It combines an action menubar, a query-backed table, and an optional details pane. Import it from its explicit Components 4 subpath.

## Import

```tsx
import { DataPage, Column } from '@cratis/components/DataPage';
```

## Core props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | ✓ | Page heading |
| `query` | generated query class | ✓ | Snapshot or observable Arc query; `DataPage` selects the correct table automatically |
| `emptyMessage` | `string` | ✓ | Message shown when the query returns no rows |
| `children` | `ReactNode` | ✓ | `<DataPage.MenuItems>` and `<DataPage.Columns>` composition |
| `queryArguments` | query argument object | | Arguments forwarded to the generated query |
| `detailsComponent` | `React.FC<IDetailsComponentProps<T>>` | | Details pane shown for the selected row |
| `selection` | row, `null`, or `undefined` | | Controlled/current selection |
| `onSelectionChange` | `(event: DataTableSelectionChangeEvent<T>) => void` | | Selection callback; the selected row is `event.value` |
| `dataKey` | `string` | | Stable row identity field |
| `globalFilterFields` | `string[]` | | Fields searched within the currently loaded page |
| `defaultFilters` | `DataTableFilterMeta` | | Initial loaded-page filters |
| `onRefresh` | `() => void` | | Refresh callback exposed to the details component |

## Declarative composition

Actions use the static `DataPage.MenuItems` and `DataPage.MenuItem` members. `command` is the activation callback; `disableOnUnselected` handles actions that require a selected row.

```tsx
<DataPage.MenuItems>
    <DataPage.MenuItem icon={FaPlus} label="Add" command={openCreate} />
    <DataPage.MenuItem
        icon={FaPencil}
        label="Edit"
        command={openEdit}
        disableOnUnselected
    />
</DataPage.MenuItems>
```

Columns are children, not a `columns` prop:

```tsx
<DataPage.Columns>
    <Column field="name" header="Name" sortable />
    <Column
        field="balance"
        header="Balance"
        body={(account) => account.balance.toFixed(2)}
    />
</DataPage.Columns>
```

## Details component

The details component receives the selected row as `item` and an `onRefresh` callback.

```tsx
const AccountDetails = ({ item, onRefresh }: IDetailsComponentProps<Account>) => (
    <AccountEditor account={item} onSaved={onRefresh} />
);
```

## Full example

```tsx
import { FaPencil, FaPlus } from 'react-icons/fa6';
import { DataPage, Column } from '@cratis/components/DataPage';
import { AllAccounts } from './AllAccounts';

export const AccountsPage = () => (
    <DataPage
        title="Accounts"
        query={AllAccounts}
        emptyMessage="No accounts found."
        detailsComponent={AccountDetails}>
        <DataPage.MenuItems>
            <DataPage.MenuItem icon={FaPlus} label="Add" command={openCreate} />
            <DataPage.MenuItem
                icon={FaPencil}
                label="Edit"
                command={openEdit}
                disableOnUnselected
            />
        </DataPage.MenuItems>
        <DataPage.Columns>
            <Column field="name" header="Account" sortable />
            <Column field="ownerName" header="Owner" />
        </DataPage.Columns>
    </DataPage>
);
```

`DataPage` needs a bounded-height ancestor so its table and paginator can size correctly.
