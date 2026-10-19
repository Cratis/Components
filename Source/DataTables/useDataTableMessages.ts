// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import type { DataTableMessageOverrides } from './DataTableMessageOverrides';
import type { DataTableMessages } from './DataTableMessages';

/**
 * Resolves each table message from its prop, then the provider's `dataTable` messages, then the default.
 * @param overrides The messages passed as props.
 * @param isServerMode Whether the server, not the loaded page, applies search and filters.
 * @returns The messages to show.
 */
export const useDataTableMessages = (
    overrides: DataTableMessageOverrides,
    isServerMode = false,
): DataTableMessages => {
    const { messages } = useCratisComponentsConfig();
    const dataTableMessages = messages?.dataTable;
    return {
        resolvedSelectionAriaLabel:
            overrides.selectionAriaLabel ?? dataTableMessages?.selectRow ?? 'Select row',
        resolvedSelectAllAriaLabel:
            overrides.selectAllAriaLabel ??
            dataTableMessages?.selectAllRows ??
            'Select all rows',
        resolvedGlobalSearchPlaceholder:
            overrides.globalSearchPlaceholder ?? dataTableMessages?.search ?? 'Search…',
        resolvedGlobalSearchAriaLabel:
            overrides.globalSearchAriaLabel ??
            dataTableMessages?.searchAriaLabel ??
            'Search table',
        resolvedLoadingMessage:
            overrides.loadingMessage ?? dataTableMessages?.loading ?? 'Loading…',
        resolvedFailureMessage:
            overrides.failureMessage ??
            dataTableMessages?.failed ??
            'Could not load data.',
        resolvedUnauthorizedMessage:
            overrides.unauthorizedMessage ??
            dataTableMessages?.unauthorized ??
            'You are not authorized to view this data.',
        resolvedFilteredEmptyMessage:
            overrides.filteredEmptyMessage ??
            (isServerMode
                ? (dataTableMessages?.filteredEmptyServer ?? 'No rows match the search.')
                : (dataTableMessages?.filteredEmpty ??
                  'No rows on this page match the search.')),
    };
};
