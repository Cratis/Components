// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Aggregate counts for one conformance run. */
export interface ConformanceSummary {
    readonly total: number;
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
}
