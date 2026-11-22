// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { unstable_adapterErrorCodes, type unstable_AdapterDiagnostic } from './errors';
import type { unstable_RendererSetup, unstable_UiLibrary } from './manifest';
import {
    unstable_defaultOverlayEnvironment,
    type unstable_CratisOverlayEnvironment,
} from './overlayEnvironment';
import {
    unstable_createRendererLayer,
    unstable_emptyCoreRendererSlots,
    unstable_sameLibraryReferences,
    unstable_validateUiLibrary,
    type unstable_RendererLayer,
    type unstable_ResolvedLibraryInput,
} from './resolve';
import type { unstable_SlotMap } from './slots';

const emptyRendererSetup = Object.freeze({}) as unstable_RendererSetup;

const freezeRendererSetup = (
    setup: Readonly<Record<string, unknown>>,
): unstable_RendererSetup =>
    Object.freeze(
        Object.fromEntries(
            Object.entries(setup).filter(([, value]) => typeof value === 'boolean'),
        ),
    ) as unstable_RendererSetup;

const nestedLibraryDiagnostic = (
    library: unstable_UiLibrary,
): unstable_AdapterDiagnostic => ({
    code: unstable_adapterErrorCodes.nestedLibraries,
    adapterId: library.id,
    message: 'A nested CratisComponentsProvider selected a conflicting renderer library.',
    remedy: 'Select renderer libraries once at the application provider and use RendererScope for local overrides.',
});

/** Freezes the supplied setup attestations, or inherits the parent's, or falls back to none. */
export const resolveRendererSetup = (
    rendererSetup: unstable_RendererSetup | undefined,
    parentSetup: unstable_RendererSetup | undefined,
): unstable_RendererSetup =>
    rendererSetup ? freezeRendererSetup(rendererSetup) : (parentSetup ?? emptyRendererSetup);

/** Creates the renderer layer for the selected library, if one was selected. */
export const createSelectedLayer = (
    selected: unstable_ResolvedLibraryInput,
): unstable_RendererLayer | undefined =>
    selected.library ? unstable_createRendererLayer(selected.library) : undefined;

const conflictsWithParent = (
    parentReferences: readonly unstable_UiLibrary[] | undefined,
    references: readonly unstable_UiLibrary[],
): boolean => {
    if (!parentReferences?.length) return false;
    return !unstable_sameLibraryReferences(parentReferences, references);
};

/** Validates the selected libraries, prefixing a nested-library conflict with the parent provider. */
export const diagnoseSelectedLibraries = (
    selected: unstable_ResolvedLibraryInput,
    parentReferences: readonly unstable_UiLibrary[] | undefined,
): readonly unstable_AdapterDiagnostic[] => {
    if (!selected.library)
        return Object.freeze([]) as readonly unstable_AdapterDiagnostic[];

    const currentDiagnostics = selected.references.flatMap((reference) =>
        unstable_validateUiLibrary(reference),
    );
    if (conflictsWithParent(parentReferences, selected.references)) {
        currentDiagnostics.unshift(nestedLibraryDiagnostic(selected.library));
    }
    return Object.freeze(currentDiagnostics);
};

/** Stacks the parent layers before the optional layer of this root. */
export const stackRendererLayers = (
    parentLayers: readonly unstable_RendererLayer[] | undefined,
    layer: unstable_RendererLayer | undefined,
): readonly unstable_RendererLayer[] =>
    Object.freeze([...(parentLayers ?? []), ...(layer ? [layer] : [])]);

/** Copies supplied Core slots, or inherits the parent's, or falls back to the empty table. */
export const resolveCoreSlots = (
    coreSlots: unstable_SlotMap | undefined,
    parentCoreSlots: unstable_SlotMap | undefined,
): unstable_SlotMap =>
    coreSlots
        ? Object.freeze({ ...coreSlots })
        : (parentCoreSlots ?? unstable_emptyCoreRendererSlots);

/** Resolves the overlay environment from this root, its parent, or the default. */
export const resolveOverlayEnvironment = (
    overlayEnvironment: unstable_CratisOverlayEnvironment | undefined,
    parentOverlayEnvironment: unstable_CratisOverlayEnvironment | undefined,
): unstable_CratisOverlayEnvironment =>
    overlayEnvironment ?? parentOverlayEnvironment ?? unstable_defaultOverlayEnvironment;

/** Uses this root's library references, or inherits the parent's when this root selects none. */
export const resolveProviderLibraryReferences = (
    references: readonly unstable_UiLibrary[],
    parentReferences: readonly unstable_UiLibrary[] | undefined,
): readonly unstable_UiLibrary[] =>
    references.length > 0 ? references : (parentReferences ?? references);
