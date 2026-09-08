// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ConformanceFamily } from './ConformanceFamily.js';
import type { ConformanceStatus } from './ConformanceStatus.js';

/** Result of one bounded, reproducible conformance assertion. */
export interface ConformanceCheck {
    readonly id: string;
    readonly family: ConformanceFamily;
    readonly status: ConformanceStatus;
    readonly slotId?: string;
    readonly message: string;
    readonly evidence?: Readonly<Record<string, unknown>>;
    readonly skipBasis?: 'unsupported-fidelity' | 'emulated-fidelity' | 'missing-capability';
}
