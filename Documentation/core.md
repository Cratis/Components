# UI-kit-free Arc bindings

Use `@cratis/components/core` when you want Cratis's React command, query, paging, observable-query, and dialog orchestration without installing PrimeReact or accepting a UI-kit license.

## Install

```bash
npm install @cratis/components @cratis/arc @cratis/arc.react @cratis/fundamentals react react-dom
```

The PrimeReact, PrimeIcons, and PrimeUIX peers are optional. They are required only when importing the rendering entry points such as `@cratis/components`, `@cratis/components/DataTables`, or `@cratis/components/Dialogs`.

## Bind commands

The core entry re-exports Arc's renderer-independent command-form contract:

```tsx
import {
    CommandForm,
    asCommandFormField,
    type WrappedFieldProps,
} from '@cratis/components/core';

interface TextControlProps extends WrappedFieldProps<string> {
    label: string;
}

const TextControl = asCommandFormField<TextControlProps>((props) => (
    <label>
        {props.label}
        <input
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            onBlur={props.onBlur}
            aria-invalid={props.invalid || undefined}
        />
    </label>
), { defaultValue: '' });

<CommandForm command={RegisterAuthor}>
    <TextControl value={(command) => command.name} label="Name" />
</CommandForm>
```

The input is ordinary HTML. Replace it with any design system without changing the command binding.

## Bind queries

```tsx
import { useObservableQueryWithPaging } from '@cratis/components/core';

const [result, setSorting, setPage, setPageSize] =
    useObservableQueryWithPaging(AllAuthors, paging);

return (
    <MyTable
        rows={result.data}
        pending={result.isPerforming}
        onPageChange={setPage}
    />
);
```

The entry also exports `useQuery`, `useQueryWithPaging`, suspense variants, query scopes/boundaries, and the `commands`, `queries`, and `dialogs` namespaces for the complete Arc surfaces.

## Neutral data-table vocabulary

`DataTableFilterMatchMode` and `DataTableFilterMeta` are included for applications that share filter state between a custom table and the PrimeReact adapter:

```typescript
import {
    DataTableFilterMatchMode,
    type DataTableFilterMeta,
} from '@cratis/components/core';

const filters: DataTableFilterMeta = {
    name: { value: 'Ada', matchMode: DataTableFilterMatchMode.Contains },
};
```

## Add rendering later

The core entry is behavior-only. Import a rendering subpath when you want the bundled PrimeReact implementation:

```tsx
import { DataTableForQuery } from '@cratis/components/DataTables';
```

That rendering choice requires you to install the optional PrimeReact peers and accept their PrimeUI license obligation. See [Migration](migration.md#licensing) before adopting those entry points.
