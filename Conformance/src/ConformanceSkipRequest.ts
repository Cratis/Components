// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Explicit request to omit one check when the manifest truthfully declares the reason. */
export interface ConformanceSkipRequest {
    readonly checkId: string;
    readonly slotId?: string;
    readonly missingCapability?: string;
}
