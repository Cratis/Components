// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { unstable_SlotId } from './slots';

/**
 * Stable diagnostic codes reserved by the unstable renderer ABI.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export const unstable_adapterErrorCodes = Object.freeze({
    abiMismatch: 'CRATIS-UI-1001',
    missingRequirement: 'CRATIS-UI-1002',
    strictProfileFallback: 'CRATIS-UI-1003',
    missingUpstreamPeer: 'CRATIS-UI-1004',
    missingLicenseKey: 'CRATIS-UI-1005',
    nestedLibraries: 'CRATIS-UI-1006',
    ssrContractViolation: 'CRATIS-UI-1007',
    duplicateResolution: 'CRATIS-UI-1008',
    deprecatedSlot: 'CRATIS-UI-1009',
} as const);

/**
 * Renderer diagnostic code from `CRATIS-UI-1001` through `CRATIS-UI-1009`.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_AdapterErrorCode =
    (typeof unstable_adapterErrorCodes)[keyof typeof unstable_adapterErrorCodes];

/**
 * Actionable renderer diagnostic. A diagnostic carries exactly one remedy so failures cannot leave
 * consumers choosing between conflicting recovery instructions.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export interface unstable_AdapterDiagnostic {
    /** Core-owned diagnostic code. */
    readonly code: unstable_AdapterErrorCode;
    /** Adapter that produced or caused the diagnostic. */
    readonly adapterId: string;
    /** Affected slot when the diagnostic is slot-specific. */
    readonly slotId?: unstable_SlotId;
    /** Human-readable explanation of the failure or degradation. */
    readonly message: string;
    /** The single action a consumer should take to remedy the diagnostic. */
    readonly remedy: string;
}
