// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { QueryStatus } from './QueryStatus';

/** The Arc query flags a display state is resolved from. */
export interface QueryStatusFlags {
    isSuccess?: boolean;
    isAuthorized?: boolean;
    hasExceptions?: boolean;
    isValid?: boolean;
    isPerforming?: boolean;
    isReady?: boolean;
}

/**
 * Resolve Arc query flags into a component-neutral display state. A settled result that is not
 * successful is a failure even when no other flag explains why, such as a response Arc could not
 * read; it never resolves to ready, which would present the failure as an empty result.
 */
export const resolveQueryStatus = (result: QueryStatusFlags): QueryStatus => {
    if (result.isAuthorized === false) return QueryStatus.Unauthorized;
    if (result.hasExceptions === true || result.isValid === false) return QueryStatus.Failed;
    if (result.isPerforming === true || result.isReady === false) return QueryStatus.Loading;
    if (result.isSuccess === false) return QueryStatus.Failed;
    return QueryStatus.Ready;
};
