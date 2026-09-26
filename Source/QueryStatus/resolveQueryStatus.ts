// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { QueryStatus } from './QueryStatus';

/** Resolve Arc query flags into a component-neutral display state. */
export const resolveQueryStatus = (result: {
    isAuthorized?: boolean;
    hasExceptions?: boolean;
    isValid?: boolean;
    isPerforming?: boolean;
}): QueryStatus => {
    if (result.isAuthorized === false) return QueryStatus.Unauthorized;
    if (result.hasExceptions === true || result.isValid === false) return QueryStatus.Failed;
    if (result.isPerforming === true) return QueryStatus.Loading;
    return QueryStatus.Ready;
};
