// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Experimental renderer contracts for adapter authors. Every public symbol is intentionally
 * `unstable_`-prefixed and isolated to `@cratis/components/renderer`; provider wiring, resolution,
 * scopes, hooks, preloading, and component routing are deferred to later slices.
 */
export type { unstable_CapabilityId } from './capabilities';
export {
    unstable_adapterErrorCodes,
    type unstable_AdapterDiagnostic,
    type unstable_AdapterErrorCode,
} from './errors';
export {
    unstable_CRATIS_UI_ABI_VERSION,
    unstable_composeUiLibraries,
    unstable_defineUiLibrary,
    type unstable_RendererExtensions,
    type unstable_RendererProps,
    type unstable_UiLibrary,
} from './manifest';
export {
    unstable_defaultOverlayEnvironment,
    type unstable_CratisOverlayEnvironment,
} from './overlayEnvironment';
export type {
    unstable_BehaviorMode,
    unstable_CratisSlots,
    unstable_Fidelity,
    unstable_SlotDeclaration,
    unstable_SlotId,
    unstable_SlotMap,
} from './slots';
