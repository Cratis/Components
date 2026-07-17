// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableRootProps } from '@primereact/types/primitive/datatable';
import { IObservableQueryFor } from '@cratis/arc/queries';
import { DataTableCore } from './DataTableCore';
import { bindObservableQuery, type BoundObservableQueryTableProps } from './bindObservableQuery';

/**
 * The PrimeReact styling pass-through the default `DataTableCore` renderer
 * accepts. Layered onto the observable query binding here (not in the
 * UI-library-agnostic {@link bindObservableQuery} seam) and forwarded verbatim
 * to `DataTableCore`.
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
 * Props for {@link DataTableForObservableQuery}.
 *
 * @typeParam TQuery - The query class implementing `IObservableQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 */
export type DataTableForObservableQueryProps<TQuery extends IObservableQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object> =
    BoundObservableQueryTableProps<TQuery, TDataType, TArguments> & DataTablePassThroughProps;

/**
 * A paged data table bound to a real-time Cratis Arc observable query
 * (`IObservableQueryFor<TDataType, TArguments>`). Subscribes via
 * `useObservableQueryWithPaging`, so the table re-renders automatically as the
 * underlying read model changes server-side. Rows render through the headless
 * {@link DataTableCore} inside an internally-scrolling region that resizes to
 * fill its container.
 *
 * This is `bindObservableQuery(DataTableCore)` — the
 * {@link bindObservableQuery} observable query/paging behavior paired with the
 * default `DataTableCore` renderer. To render a query's paged rows with a
 * *different* table implementation, call `bindObservableQuery` with your own
 * {@link TableRenderer}. See
 * [Bring your own table renderer](../../Documentation/DataTables/bring-your-own-renderer.md).
 *
 * ## Children
 *
 * Children are Cratis `<Column>` elements describing the visible columns.
 *
 * ```tsx
 * import { DataTableForObservableQuery, Column } from '@cratis/components/DataTables';
 * import { AllTasks } from './AllTasks';     // observable proxy from C#
 *
 * <DataTableForObservableQuery query={AllTasks} emptyMessage="No tasks">
 *     <Column field="title" header="Title" sortable />
 *     <Column field="assignee" header="Assignee" />
 * </DataTableForObservableQuery>
 * ```
 *
 * Use {@link DataTableForQuery} for one-shot snapshot queries. Use
 * `DataPage` for a higher-level layout that combines this table with
 * an action menubar, selection, and a details pane.
 *
 * @typeParam TQuery - The query class (proxy generated from C# `IObservableQueryFor`).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataTableForObservableQueryProps}.
 */
export const DataTableForObservableQuery = bindObservableQuery<DataTablePassThroughProps>(DataTableCore);
