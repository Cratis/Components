// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Internal display state resolved from query flags, independent of the consuming component. */
export enum QueryStatus {
    Ready = 'ready',
    Loading = 'loading',
    Failed = 'failed',
    Unauthorized = 'unauthorized',
}
