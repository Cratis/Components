// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** UI-kit-free Arc command-binding namespace. */
export * as commands from '@cratis/arc.react/commands';
/** UI-kit-free Arc query-binding namespace. */
export * as queries from '@cratis/arc.react/queries';
/** UI-kit-free Arc dialog-orchestration namespace. */
export * as dialogs from '@cratis/arc.react/dialogs';

export {
    CommandForm,
    CommandScope,
    asCommandFormField,
    useCommand,
    useCommandScope,
    type WrappedFieldProps,
} from '@cratis/arc.react/commands';

export {
    ObservableQueryWhen,
    QueryBoundary,
    QueryWhen,
    useObservableQuery,
    useObservableQueryWithPaging,
    useQuery,
    useQueryWithPaging,
    useSuspenseObservableQuery,
    useSuspenseQuery,
} from '@cratis/arc.react/queries';

export {
    DialogButtons,
    DialogResult,
    useBusyIndicator,
    useConfirmationDialog,
    useDialog,
} from '@cratis/arc.react/dialogs';

export {
    DataTableFilterMatchMode,
    type DataTableFilterMeta,
} from '../DataTables/DataTableFilterMeta';
