// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { QueryStatus } from '../QueryStatus/QueryStatus';
import { resolveQueryStatus } from '../QueryStatus/resolveQueryStatus';
import { DataTableStatus } from './DataTableStatus';

const tableStatusByQueryStatus: Record<QueryStatus, DataTableStatus> = {
    [QueryStatus.Ready]: DataTableStatus.Ready,
    [QueryStatus.Loading]: DataTableStatus.Loading,
    [QueryStatus.Failed]: DataTableStatus.Failed,
    [QueryStatus.Unauthorized]: DataTableStatus.Unauthorized,
};

/** Resolve Arc query flags into the table's display state. */
export const resolveDataTableStatus = (result: {
    isAuthorized?: boolean;
    hasExceptions?: boolean;
    isValid?: boolean;
    isPerforming?: boolean;
}): DataTableStatus => tableStatusByQueryStatus[resolveQueryStatus(result)];
