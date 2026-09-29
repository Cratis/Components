// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';

/** Table messages passed as props, each overriding the provider's message. */
export interface DataTableMessageOverrides {
    selectionAriaLabel?: string;
    selectAllAriaLabel?: string;
    globalSearchPlaceholder?: string;
    globalSearchAriaLabel?: string;
    loadingMessage?: ReactNode;
    failureMessage?: ReactNode;
    unauthorizedMessage?: ReactNode;
}
