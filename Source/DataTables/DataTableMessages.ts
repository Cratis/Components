// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';

/** The table messages to show, after props and provider messages are applied. */
export interface DataTableMessages {
    resolvedSelectionAriaLabel: string;
    resolvedSelectAllAriaLabel: string;
    resolvedGlobalSearchPlaceholder: string;
    resolvedGlobalSearchAriaLabel: string;
    resolvedLoadingMessage: ReactNode;
    resolvedFailureMessage: ReactNode;
    resolvedUnauthorizedMessage: ReactNode;
}
