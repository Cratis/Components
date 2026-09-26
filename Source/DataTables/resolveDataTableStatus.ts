// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DataTableStatus } from './DataTableStatus';

/** Resolve Arc query flags into the table's display state. */
export const resolveDataTableStatus = (result: {
    isAuthorized?: boolean;
    hasExceptions?: boolean;
    isValid?: boolean;
    isPerforming?: boolean;
}): DataTableStatus => {
    if (result.isAuthorized === false) return DataTableStatus.Unauthorized;
    if (result.hasExceptions === true || result.isValid === false) return DataTableStatus.Failed;
    // Core shows a loading row without data, or keeps existing rows and marks them busy.
    if (result.isPerforming === true) return DataTableStatus.Loading;
    return DataTableStatus.Ready;
};
