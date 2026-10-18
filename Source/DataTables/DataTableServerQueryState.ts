// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableFilterMeta } from './DataTableFilterMeta';

/** The filter and search state a server query turns into query arguments. */
export interface DataTableServerQueryState {
    /** The applied column filters, keyed by column field. Empty when no column is filtered. */
    filters: DataTableFilterMeta;
    /** The search text once typing has paused. Empty when nothing is searched for. */
    globalFilter: string;
}
