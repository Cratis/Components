// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type CSSProperties, type ReactNode, useMemo } from 'react';
import { Page } from '../Common/Page';
import React from 'react';
import { ActionMenubar, type ActionMenuItem } from '../Common/ActionMenubar';
import type { ButtonParts } from '../Common/Button';
import { type IObservableQueryFor, type IQueryFor, QueryFor } from '@cratis/arc/queries';
import { DataTableForObservableQuery } from '../DataTables/DataTableForObservableQuery';
import type { DataTableParts } from '../DataTables/DataTableCore';
import { DataTableForQuery } from '../DataTables/DataTableForQuery';
import type {
    TablePaginatorParts,
    TablePaginatorProps,
} from '../DataTables/TablePaginator';
import type { DataTableFilterMeta } from '../DataTables/DataTableFilterMeta';
import type { DataTableSelectionChangeEvent } from '../DataTables/DataTableSelectionChangeEvent';
import { Allotment } from 'allotment';
import type { Constructor } from '@cratis/fundamentals';
import { DataPageLayout } from './DataPageLayout';

// Allotment ships its layout as a stylesheet rather than inline styles, and a pane only becomes
// the absolutely positioned, full-height box the split view assumes once that stylesheet is on
// the page. It used to be pulled in here with a bare `import 'allotment/dist/style.css'`, but a
// CSS import inside the JS graph is precisely what stops the published ESM from loading in Node
// (Cratis/Components#118). The rules now ship inside this package's own `./styles` entry point,
// which the build concatenates from every component stylesheet plus this third-party one — so a
// consumer still gets a working split view, from the single stylesheet they already import.

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Props for {@link MenuItem} — a single action in a {@link DataPage}'s
 * action bar.
 */
export interface MenuItemProps {
    /** Icon component rendered before the label (e.g. a react-icons icon). */
    icon?: React.ComponentType<{ className?: string }>;
    /** The visible label. */
    label?: string;
    /** Invoked when the item is activated. */
    command?: () => void;
    /** When true, the item is greyed out regardless of selection. */
    disabled?: boolean;
    /**
     * When true, the menu item is disabled while no row is selected in the
     * surrounding {@link DataPage}. Use it for context-sensitive actions like
     * "Edit" or "Delete" that require a selection.
     */
    disableOnUnselected?: boolean;
}

/**
 * Declarative menu item for use inside `<DataPage.MenuItems>`. Renders nothing
 * directly; the surrounding {@link MenuItems} component reads its props and
 * forwards them to the action menubar.
 */
export const MenuItem = (_props: MenuItemProps) => {
    return null;
};

/**
 * Props for {@link MenuItems}.
 */
export interface MenuItemsProps {
    /** One or more `<DataPage.MenuItem>` elements. */
    children: ReactNode;
}

/**
 * Props for {@link Columns}.
 */
export interface ColumnProps {
    /** Cratis-owned `<Column>` markers describing each visible column. */
    children: ReactNode;
}

/**
 * The action bar is an intrinsically sized item in the page's layout column —
 * it takes the height its menubar needs and never gives any of it up, so the
 * table region below it is the only part that has to adapt to the space left.
 */
const actionsStyle: CSSProperties = { flexShrink: 0 };

/**
 * The table region takes every pixel the action bar leaves and no more.
 * `minHeight: 0` is the load-bearing half: without it the region's automatic
 * minimum keeps it at content height, the column grows past the page, and the
 * table's paginator ends up below the clipped edge.
 */
const tableRegionStyle: CSSProperties = { flexGrow: 1, flexBasis: 0, minHeight: 0 };

/**
 * The floor a `DataPage` falls back to when its ancestors give it no height at
 * all. A page that renders as an empty sliver is indistinguishable from a
 * broken one, so a contract-violating consumer gets a small but usable page
 * instead of nothing.
 */
const pageStyle: CSSProperties = { minHeight: '20rem' };

/**
 * Renders an action menubar at the top of a {@link DataPage}, populated from
 * `<DataPage.MenuItem>` children. Each menu item's `disableOnUnselected` flag
 * is automatically honored against the current row selection.
 *
 * Use as `<DataPage.MenuItems>` inside a `<DataPage>`.
 */
export const MenuItems = ({ children }: MenuItemsProps) => {
    const context = useDataPageContext();
    const isDisabled = !context.selectedItem;

    const items = useMemo(() => {
        const menuItems: ActionMenuItem[] = [];
        React.Children.forEach(children, (child) => {
            if (React.isValidElement<MenuItemProps>(child) && child.type === MenuItem) {
                const Icon = child.props.icon;
                menuItems.push({
                    label: child.props.label,
                    command: child.props.command,
                    icon: Icon ? <Icon className='mr-2' /> : undefined,
                    disabled:
                        (child.props.disabled ?? false) ||
                        (isDisabled && (child.props.disableOnUnselected ?? false)),
                });
            }
        });

        return menuItems;
    }, [children, isDisabled]);

    return (
        <div className='cratis-data-page-actions px-4 py-2' style={actionsStyle}>
            <ActionMenubar
                aria-label={context.actionsAriaLabel ?? 'Actions'}
                model={items}
                className={context.menubarClassName}
                pt={context.menubarPt}
                ptOptions={context.menubarPtOptions}
                unstyled={context.menubarUnstyled}
            />
        </div>
    );
};

/**
 * Renders the data table at the body of a {@link DataPage}. Automatically
 * selects between {@link DataTableForQuery} (snapshot query) and
 * {@link DataTableForObservableQuery} (real-time observable) based on the
 * `query` type provided to the surrounding `<DataPage>`.
 *
 * Use as `<DataPage.Columns>` inside a `<DataPage>`, with Cratis-owned `<Column>`
 * children defining the table columns.
 */
export const Columns = ({ children }: ColumnProps) => {
    const context = useDataPageContext();
    const isSnapshotQuery = context.query.prototype instanceof QueryFor;

    return (
        <div className='cratis-data-page-table' style={tableRegionStyle}>
            {isSnapshotQuery ? (
                <DataTableForQuery
                    {...context}
                    selection={context.selectedItem}
                    onSelectionChange={context.onSelectionChanged}
                    className={context.tableClassName}
                    pt={context.tablePt}
                    ptOptions={context.tablePtOptions}
                    unstyled={context.tableUnstyled}
                >
                    {children}
                </DataTableForQuery>
            ) : (
                <DataTableForObservableQuery
                    {...context}
                    selection={context.selectedItem}
                    onSelectionChange={context.onSelectionChanged}
                    className={context.tableClassName}
                    pt={context.tablePt}
                    ptOptions={context.tablePtOptions}
                    unstyled={context.tableUnstyled}
                >
                    {children}
                </DataTableForObservableQuery>
            )}
        </div>
    );
};

/**
 * Props passed to the optional details component rendered on the right pane
 * of a {@link DataPage} when a row is selected.
 *
 * @typeParam TDataType - The type of the selected item.
 */
export interface IDetailsComponentProps<TDataType> {
    /** The currently-selected row. */
    item: TDataType;

    /**
     * Callback the details component can invoke to ask the surrounding page to
     * refresh its data — for example after the details panel has performed a
     * mutating action.
     */
    onRefresh?: () => void;
}

interface IDataPageContext extends DataPageProps<any, any, any> {
    selectedItem: any;
    onSelectionChanged: (e: DataTableSelectionChangeEvent<any>) => void;
}

const DataPageContext = React.createContext<IDataPageContext | null>(null);

function useDataPageContext(): IDataPageContext {
    const context = React.useContext(DataPageContext);
    if (!context) {
        throw new Error('useDataPageContext must be used within a DataPage component');
    }
    return context;
}

/**
 * Props for {@link DataPage}.
 *
 * @typeParam TQuery - The query class — either a snapshot `IQueryFor` or a real-time `IObservableQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type, or `object` if the query takes none.
 */
export interface DataPageProps<
    TQuery extends IQueryFor<TDataType> | IObservableQueryFor<TDataType>,
    TDataType extends object,
    TArguments,
> {
    /**
     * The title of the page
     */
    title: string;

    /**
     * Children to render, for this it means menu items and columns. Use <DataPage.MenuItems> and <DataPage.Columns> for this.
     */
    children: ReactNode;

    /**
     * Component to render when the selection changes
     */
    detailsComponent?: React.FC<IDetailsComponentProps<TDataType>>;

    /**
     * The type of query to use
     */
    query: Constructor<TQuery>;

    /**
     * Optional arguments to pass to the query
     */
    queryArguments?: TArguments;

    /**
     * The message to show when there is no data
     */
    emptyMessage: string;

    /**
     * The key to use for the data
     */
    dataKey?: string | undefined;

    /**
     * The current selection.
     */
    selection?: TDataType | undefined | null;

    /**
     * Callback for when the selection changes
     */
    onSelectionChange?(event: DataTableSelectionChangeEvent<TDataType>): void;

    /**
     * Fields to use for global filtering
     */
    globalFilterFields?: string[] | undefined;

    /**
     * Default filters to use
     */
    defaultFilters?: DataTableFilterMeta;

    /**
     * @deprecated Filtering is always applied to the currently loaded page.
     * This compatibility prop no longer toggles behavior and does not change
     * server-reported pagination totals.
     */
    clientFiltering?: boolean;

    /**
     * Callback triggered to signal data refresh
     */
    onRefresh?(): void;

    /**
     * Extra CSS class name forwarded to the inner DataTable root.
     */
    tableClassName?: string;

    /** Cratis-owned per-part attributes applied to the inner table. */
    tablePt?: DataTableParts;

    /** Retained for source compatibility; Cratis parts always merge. */
    tablePtOptions?: object;

    /** Legacy renderer flag retained for source compatibility; ignored on the inner DataTable. */
    tableUnstyled?: boolean;

    /** Extra CSS class name forwarded to the query table paginator. */
    paginatorClassName?: string;

    /** Cratis-owned attributes applied to the query table paginator. */
    paginatorPt?: TablePaginatorParts;

    /** Retained for source compatibility; Cratis parts always merge. */
    paginatorPtOptions?: object;

    /** Accessible paginator labels. Override any value to localize it. */
    paginatorAriaLabels?: TablePaginatorProps['ariaLabels'];

    /**
     * Extra CSS class name forwarded to the action menubar root.
     */
    menubarClassName?: string;

    /** Cratis-owned part attributes applied to the action menubar's buttons. */
    menubarPt?: ButtonParts;

    /** Retained for source compatibility; Cratis parts always merge. */
    menubarPtOptions?: object;

    /** Legacy renderer flag retained for source compatibility; ignored on the action menubar's buttons. */
    menubarUnstyled?: boolean;

    /**
     * Accessible name for the action menubar (toolbar). Override to localize.
     * Defaults to `'Actions'`.
     */
    actionsAriaLabel?: string;
}

/**
 * A page primitive that combines an action menubar, a query-backed data
 * table, and an optional details pane into one layout. Designed as the
 * default rendering for "list view" pages in an Arc app.
 *
 * ## What `TQuery` is
 *
 * `TQuery` is the auto-generated TypeScript class produced by the Arc proxy
 * generator from a C# read model query. Two flavors are accepted and
 * **selected automatically at runtime** based on the class hierarchy:
 *
 * - **`IQueryFor<TDataType, TArguments>`** — a snapshot query. Re-fetched
 *   when `queryArguments` change or when the page is mounted. Rendered
 *   through {@link DataTableForQuery} internally.
 * - **`IObservableQueryFor<TDataType, TArguments>`** — a real-time
 *   subscription. Connects to the backend over WebSocket and re-renders
 *   automatically whenever the underlying read model changes server-side.
 *   Rendered through {@link DataTableForObservableQuery} internally.
 *
 * You don't pick which inner table to use — `DataPage` inspects the
 * prototype chain (`context.query.prototype instanceof QueryFor`) and
 * mounts the correct one.
 *
 * ## Declarative composition
 *
 * Three children build up the page:
 *
 * - **`<DataPage.MenuItems>`** wraps `<DataPage.MenuItem>` elements that
 *   become the action `Menubar` at the top. Each item declares its `icon`,
 *   `label`, and `command` (an `onClick` handler). Items can be marked
 *   `disableOnUnselected` so they automatically grey out until the user
 *   picks a row — useful for Edit / Delete actions that need a target.
 *
 * - **`<DataPage.Columns>`** wraps Cratis-owned `<Column>` markers that
 *   describe the visible columns. The columns themselves are
 *   Cratis-owned — the documented `ColumnProps` surface is
 *   supported here (sorting, filtering, custom body templates, …).
 *
 * - **`detailsComponent`** (optional) is a React component rendered in a
 *   right-hand pane via Allotment when a row is selected. It receives the
 *   selected item as `item` and an `onRefresh` callback the parent can
 *   invoke to ask the page to refetch.
 *
 * ## Selection lifecycle
 *
 * `DataPage` keeps the current selection in local state and threads it to
 * the inner table, the menubar (`disableOnUnselected` items follow it),
 * and the optional details pane. The `onSelectionChange` prop is invoked
 * after every change if the consumer also needs to react to it.
 *
 * ```tsx
 * <DataPage<AllAuthors, Author, never>
 *     title="Authors"
 *     query={AllAuthors}                          // proxy from C#
 *     detailsComponent={AuthorDetails}>
 *     <DataPage.MenuItems>
 *         <DataPage.MenuItem icon={FaPlus}   label="Add"    command={onAdd} />
 *         <DataPage.MenuItem icon={FaPencil} label="Edit"   command={onEdit}
 *                            disableOnUnselected />
 *         <DataPage.MenuItem icon={FaTrash}  label="Delete" command={onDelete}
 *                            disableOnUnselected />
 *     </DataPage.MenuItems>
 *     <DataPage.Columns>
 *         <Column field="name"  header="Name" sortable />
 *         <Column field="email" header="Email" />
 *     </DataPage.Columns>
 * </DataPage>
 * ```
 *
 * ## Height — `DataPage` needs a bounded ancestor
 *
 * `DataPage` fills the height it is given and divides it between the action
 * bar and the table region, so the table's paginator always sits at the
 * bottom of the page rather than below its edge. It cannot invent that height:
 * every element from the page root down sizes as a percentage of its parent,
 * so **some ancestor has to have a definite height**.
 *
 * ```tsx
 * // ✅ the router outlet, a sized container, or a flex child with min-height
 * <div style={{ height: '100vh' }}>
 *     <DataPage … />
 * </div>
 *
 * // ❌ nothing above resolves to a height — the table grows to its content
 * <div>
 *     <DataPage … />
 * </div>
 * ```
 *
 * Without one, the page falls back to a small fixed height so it stays
 * usable instead of collapsing to nothing.
 *
 * ## Styling
 *
 * The inner DataTable and action toolbar each have their own per-slot props:
 * `tablePt` / `tableUnstyled` / `tableClassName` for the table;
 * `paginatorPt` / `paginatorClassName` / `paginatorAriaLabels` for paging;
 * `menubarPt` / `menubarPtOptions` / `menubarUnstyled` / `menubarClassName` for
 * the action toolbar's stable button parts (the action bar is implemented as
 * a button toolbar, so `menubarPt` targets the stable Cratis button parts). See the
 * [pass-through cheat sheet](../../Documentation/Styling/pass-through.md) for
 * the full slot reference.
 *
 * @typeParam TQuery - The query class (proxy generated from a C# read model query).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataPageProps}.
 */
const DataPage = <
    TQuery extends IQueryFor<TDataType> | IObservableQueryFor<TDataType, TArguments>,
    TDataType extends object,
    TArguments extends object,
>(
    props: DataPageProps<TQuery, TDataType, TArguments>,
) => {
    const [internalSelection, setInternalSelection] = React.useState<
        TDataType | null | undefined
    >(props.selection);
    const selectedItem =
        props.selection !== undefined ? props.selection : internalSelection;

    const selectionChanged = (event: DataTableSelectionChangeEvent<TDataType>) => {
        if (props.selection === undefined) setInternalSelection(event.value);
        props.onSelectionChange?.(event);
    };

    const context = { ...props, selectedItem, onSelectionChanged: selectionChanged };

    return (
        <DataPageContext.Provider value={context}>
            <Page title={props.title} panel={true} style={pageStyle}>
                {props.detailsComponent ? (
                    <Allotment className='h-full' proportionalLayout={false}>
                        <Allotment.Pane>
                            <DataPageLayout>{props.children}</DataPageLayout>
                        </Allotment.Pane>
                        {selectedItem && (
                            <Allotment.Pane preferredSize='450px'>
                                <props.detailsComponent
                                    item={selectedItem}
                                    onRefresh={props.onRefresh}
                                />
                            </Allotment.Pane>
                        )}
                    </Allotment>
                ) : (
                    <DataPageLayout>{props.children}</DataPageLayout>
                )}
            </Page>
        </DataPageContext.Provider>
    );
};

DataPage.MenuItem = MenuItem;
DataPage.MenuItems = MenuItems;
DataPage.Columns = Columns;

export { DataPage };
