// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode, useMemo } from 'react';
import { Page } from '../Common/Page';
import React from 'react';
import { MenuItem as PrimeMenuItem } from 'primereact/menuitem';
import { Menubar, type MenubarProps } from 'primereact/menubar';
import { IObservableQueryFor, IQueryFor, QueryFor } from '@cratis/arc/queries';
import { DataTableForObservableQuery } from '../DataTables/DataTableForObservableQuery';
import { DataTableFilterMeta, DataTableSelectionSingleChangeEvent, type DataTableProps as PrimeDataTableProps } from 'primereact/datatable';
import { DataTableForQuery } from '../DataTables/DataTableForQuery';
import { Allotment } from 'allotment';
import { Constructor } from '@cratis/fundamentals';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Props for {@link MenuItem}. Extends PrimeReact's `MenuItem` shape with one
 * Cratis-specific flag.
 */
export interface MenuItemProps extends PrimeMenuItem {
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
 * forwards them to the action `Menubar`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const MenuItem = (_: MenuItemProps) => {
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
    /** PrimeReact `<Column>` elements describing each visible column. */
    children: ReactNode;
}

/**
 * Renders an action `Menubar` at the top of a {@link DataPage}, populated from
 * `<DataPage.MenuItem>` children. Each menu item's `disableOnUnselected` flag
 * is automatically honored against the current row selection.
 *
 * Use as `<DataPage.MenuItems>` inside a `<DataPage>`.
 */
export const MenuItems = ({ children }: MenuItemsProps) => {
    const context = useDataPageContext();

    const isDisabled = useMemo(() => {
        return !context.selectedItem;
    }, [context.selectedItem]);

    const items = useMemo(() => {
        const menuItems: PrimeMenuItem[] = [];
        React.Children.forEach(children, (child) => {
            if (React.isValidElement<MenuItemProps>(child) && child.type == MenuItem) {
                const Icon = child.props.icon;
                const menuItem = { ...child.props };
                menuItem.icon = <Icon className='mr-2' />;
                menuItem.disabled = isDisabled && child.props.disableOnUnselected;
                menuItems.push(menuItem);
            }
        });

        return menuItems;
    }, [children, context.selectedItem]);

    return (
        <div className="px-4 py-2">
            <Menubar
                aria-label="Actions"
                model={items}
                className={context.menubarClassName}
                pt={context.menubarPt}
                ptOptions={context.menubarPtOptions}
                unstyled={context.menubarUnstyled}
            />
        </div>);
};

/**
 * Renders the data table at the body of a {@link DataPage}. Automatically
 * selects between {@link DataTableForQuery} (snapshot query) and
 * {@link DataTableForObservableQuery} (real-time observable) based on the
 * `query` type provided to the surrounding `<DataPage>`.
 *
 * Use as `<DataPage.Columns>` inside a `<DataPage>`, with PrimeReact `<Column>`
 * children defining the table columns.
 */
export const Columns = ({ children }: ColumnProps) => {

    const context = useDataPageContext();

    if (context.query.prototype instanceof QueryFor) {
        return (
            <DataTableForQuery
                {...context}
                selection={context.selectedItem}
                onSelectionChange={context.onSelectionChanged}
                clientFiltering={context.clientFiltering}
                className={context.tableClassName}
                pt={context.tablePt}
                ptOptions={context.tablePtOptions}
                unstyled={context.tableUnstyled}>
                {children}
            </DataTableForQuery>);

    } else {
        return (
            <DataTableForObservableQuery
                {...context}
                selection={context.selectedItem}
                onSelectionChange={context.onSelectionChanged}
                clientFiltering={context.clientFiltering}
                className={context.tableClassName}
                pt={context.tablePt}
                ptOptions={context.tablePtOptions}
                unstyled={context.tableUnstyled}>
                {children}
            </DataTableForObservableQuery>);
    }
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
    onSelectionChanged: (e: DataTableSelectionSingleChangeEvent<any>) => void;
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
export interface DataPageProps<TQuery extends IQueryFor<TDataType> | IObservableQueryFor<TDataType>, TDataType extends object, TArguments> {
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
    detailsComponent?: React.FC<IDetailsComponentProps<any>>;

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
    selection?: any | undefined | null;

    /**
     * Callback for when the selection changes
     */
    onSelectionChange?(event: DataTableSelectionSingleChangeEvent<any>): void;

    /**
     * Fields to use for global filtering
     */
    globalFilterFields?: string[] | undefined;

    /**
     * Default filters to use
     */
    defaultFilters?: DataTableFilterMeta;

    /**
     * When true, filtering is performed client-side only
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

    /** PrimeReact pass-through configuration applied to the inner DataTable. */
    tablePt?: PrimeDataTableProps<TDataType[]>['pt'];

    /** PrimeReact pass-through options applied to the inner DataTable. */
    tablePtOptions?: PrimeDataTableProps<TDataType[]>['ptOptions'];

    /** When true, disables every base PrimeReact style on the inner DataTable. */
    tableUnstyled?: boolean;

    /**
     * Extra CSS class name forwarded to the action Menubar root.
     */
    menubarClassName?: string;

    /** PrimeReact pass-through configuration applied to the action Menubar. */
    menubarPt?: MenubarProps['pt'];

    /** PrimeReact pass-through options applied to the action Menubar. */
    menubarPtOptions?: MenubarProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the action Menubar. */
    menubarUnstyled?: boolean;
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
 * - **`<DataPage.Columns>`** wraps PrimeReact `<Column>` elements that
 *   describe the visible columns. The columns themselves are
 *   PrimeReact's — anything supported by their `DataTable` `<Column>` is
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
 * ## Styling
 *
 * The inner DataTable and Menubar each have their own per-slot props:
 * `tablePt` / `tableUnstyled` / `tableClassName` for the table;
 * `menubarPt` / `menubarUnstyled` / `menubarClassName` for the action
 * menubar. See the [pass-through cheat sheet](../../Documentation/Styling/pass-through.md)
 * for the full slot reference.
 *
 * @typeParam TQuery - The query class (proxy generated from a C# read model query).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataPageProps}.
 */
const DataPage = <TQuery extends IQueryFor<TDataType> | IObservableQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object>(props: DataPageProps<TQuery, TDataType, TArguments>) => {
    const [selectedItem, setSelectedItem] = React.useState(undefined);

    const selectionChanged = (e: DataTableSelectionSingleChangeEvent<any>) => {
        setSelectedItem(e.value);
        if (props.onSelectionChange) {
            props.onSelectionChange(e);
        }
    };

    const context = { ...props, selectedItem, onSelectionChanged: selectionChanged };

    return (
        <DataPageContext.Provider value={context}>
            <Page title={props.title} panel={true}>
                <Allotment className="h-full" proportionalLayout={false}>
                    <Allotment.Pane className="flex-grow">
                        {props.children}
                    </Allotment.Pane>
                    {props.detailsComponent && selectedItem &&
                        <Allotment.Pane preferredSize="450px">
                            <props.detailsComponent item={selectedItem} onRefresh={props.onRefresh} />
                        </Allotment.Pane>
                    }
                </Allotment>
            </Page>
        </DataPageContext.Provider>
    );
};

DataPage.MenuItems = MenuItems;
DataPage.Columns = Columns;

export { DataPage };
