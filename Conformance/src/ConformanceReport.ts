// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ConformanceCheck } from './ConformanceCheck.js';
import type { ConformanceLimitation } from './ConformanceLimitation.js';
import type { ConformanceSummary } from './ConformanceSummary.js';

/** Bounded evidence returned for one renderer library. */
export interface ConformanceReport {
    readonly adapterId: string;
    readonly abi: number;
    readonly passed: boolean;
    readonly summary: ConformanceSummary;
    readonly checks: readonly ConformanceCheck[];
    readonly limitations: readonly ConformanceLimitation[];
}
