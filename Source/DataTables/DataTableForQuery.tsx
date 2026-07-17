// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableRootProps } from '@primereact/types/primitive/datatable';
import { IQueryFor } from '@cratis/arc/queries';
import { DataTableCore } from './DataTableCore';
import { bindQuery, type BoundQueryTableProps } from './bindQuery';

/**
 * The PrimeReact styling pass-through the default `DataTableCore` renderer
 * accepts. Layered onto the query binding here (not in the UI-library-agnostic
 * {@link bindQuery} seam) and forwarded verbatim to `DataTableCore`.
 */
interface DataTablePassThroughProps {
    /** PrimeReact pass-through configuration applied to the underlying DataTable. */
    pt?: DataTableRootProps['pt'];
    /** PrimeReact pass-through options applied to the underlying DataTable. */
    ptOptions?: DataTableRootProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the underlying DataTable. */
    unstyled?: boolean;
}

/**
 * Props for {@link DataTableForQuery}.
 *
 * @typeParam TQuery - The query class implementing `IQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type, or `object` if it takes none.
 */
export type DataTableForQueryProps<TQuery extends IQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object> =
    BoundQueryTableProps<TQuery, TDataType, TArguments> & DataTablePassThroughProps;

/**
 * A paged data table bound to a snapshot Cratis Arc query
 * (`IQueryFor<TDataType, TArguments>`). Subscribes via
 * `useQueryWithPaging` from `@cratis/arc.react/queries`, renders the result
 * page through the headless {@link DataTableCore}, and shows a
 * `TablePaginator` when the result set exceeds one page.
 *
 * This is `bindQuery(DataTableCore)` — the {@link bindQuery} query/paging
 * behavior paired with the default `DataTableCore` renderer. To render a
 * query's paged rows with a *different* table implementation, call `bindQuery`
 * with your own {@link TableRenderer}; you get the same props and behavior with
 * your own rendering. See
 * [Bring your own table renderer](../../Documentation/DataTables/bring-your-own-renderer.md).
 *
 * ## What `TQuery` is
 *
 * `TQuery` is the auto-generated TypeScript class produced by the Arc proxy
 * generator from a C# read model's static query method. `dotnet build`
 * writes a `.ts` file per query with the right return type and a `use()`
 * hook; importing the class is all the connection-to-the-backend you need.
 *
 * ## Children
 *
 * Children are Cratis `<Column>` elements describing the visible columns —
 * `field`, `header`, custom `body` templates, and `sortable`.
 *
 * ```tsx
 * import { DataTableForQuery, Column } from '@cratis/components/DataTables';
 * import { AllAuthors } from './AllAuthors';     // proxy from C#
 *
 * <DataTableForQuery query={AllAuthors} emptyMessage="No authors">
 *     <Column field="name"  header="Name" sortable />
 *     <Column field="email" header="Email" />
 * </DataTableForQuery>
 * ```
 *
 * Use {@link DataTableForObservableQuery} for queries that should update in
 * real time as the underlying read model changes server-side. Use
 * `DataPage` for a higher-level layout that combines this table with
 * an action menubar, selection, and a details pane.
 *
 * ## Styling
 *
 * Forward `pt` / `ptOptions` / `unstyled` / `className` to the underlying
 * DataTable. See [pass-through cheat sheet](../../Documentation/Styling/pass-through.md).
 *
 * @typeParam TQuery - The query class (proxy generated from C# `IQueryFor`).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataTableForQueryProps}.
 */
export const DataTableForQuery = bindQuery<DataTablePassThroughProps>(DataTableCore);
