// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { unstable_AdapterDiagnostic } from './errors';
import { unstable_adapterErrorCodes } from './errors';
import {
    unstable_composeUiLibraries,
    unstable_CRATIS_UI_ABI_VERSION,
    type unstable_UiLibrary,
} from './manifest';
import type {
    unstable_SlotDeclaration,
    unstable_SlotId,
    unstable_SlotMap,
} from './slots';

const knownSlots = new Set<unstable_SlotId>([
    'common.button',
    'common.iconButton',
    'common.textInput',
    'common.textArea',
    'common.checkbox',
    'common.radio',
    'common.switch',
    'common.progress',
    'common.surface',
    'common.tooltip',
    'dropdown.select',
    'dialogs.dialog',
    'display.datePicker',
    'datatables.paginator',
]);

/** Internal immutable renderer layer used by context resolution. */
export interface unstable_RendererLayer {
    readonly library: unstable_UiLibrary;
    readonly slots: unstable_SlotMap;
    readonly only?: ReadonlySet<unstable_SlotId>;
}

/** Identity-preserving normalization result for a provider or scope library input. */
export interface unstable_ResolvedLibraryInput {
    readonly library?: unstable_UiLibrary;
    readonly references: readonly unstable_UiLibrary[];
}

/** Empty D2 Core fallback table. Slice E can inject its built-in table without a registry. */
export const unstable_emptyCoreRendererSlots: unstable_SlotMap = Object.freeze({});

/** Returns whether a value is one of the Core-owned slot identifiers. */
export const unstable_isKnownSlot = (value: unknown): value is unstable_SlotId =>
    typeof value === 'string' && knownSlots.has(value as unstable_SlotId);

/** Normalizes one library or an ordered last-wins composition without deep merging it. */
export const unstable_resolveLibraryInput = (
    input: unstable_UiLibrary | readonly unstable_UiLibrary[] | undefined,
): unstable_ResolvedLibraryInput => {
    if (!input) return Object.freeze({ references: Object.freeze([]) });

    const references = Object.freeze(Array.isArray(input) ? [...input] : [input]);
    if (references.length === 0) {
        return Object.freeze({ references });
    }

    return Object.freeze({
        library:
            references.length === 1
                ? references[0]
                : unstable_composeUiLibraries(...references),
        references,
    });
};

/** Creates one immutable slot lookup snapshot for a manifest and optional scope filter. */
export const unstable_createRendererLayer = (
    library: unstable_UiLibrary,
    only?: readonly unstable_SlotId[],
): unstable_RendererLayer =>
    Object.freeze({
        library,
        slots: Object.freeze({ ...library.slots }),
        only: only ? new Set(only) : undefined,
    });

const missingRequirement = (
    library: unstable_UiLibrary,
    message: string,
    remedy: string,
    slotId?: unstable_SlotId,
): unstable_AdapterDiagnostic => ({
    code: unstable_adapterErrorCodes.missingRequirement,
    adapterId: library.id,
    slotId,
    message,
    remedy,
});

/** Runs ABI, profile, capability, and adapter preflight validation. */
export const unstable_validateUiLibrary = (
    library: unstable_UiLibrary,
): readonly unstable_AdapterDiagnostic[] => {
    const diagnostics: unstable_AdapterDiagnostic[] = [];

    if (library.abi !== unstable_CRATIS_UI_ABI_VERSION) {
        diagnostics.push({
            code: unstable_adapterErrorCodes.abiMismatch,
            adapterId: library.id,
            message: `Renderer ABI ${library.abi} does not match Core ABI ${unstable_CRATIS_UI_ABI_VERSION}.`,
            remedy: `Install a renderer that targets ABI ${unstable_CRATIS_UI_ABI_VERSION}.`,
        });
    }

    const profileSlots = library.profileSlots ?? Object.keys(library.slots);
    if (profileSlots.length > 0 && !library.capabilities.includes('slot.render')) {
        diagnostics.push(
            missingRequirement(
                library,
                `Profile '${library.profile}' promises slots without the 'slot.render' capability.`,
                "Declare 'slot.render' only after the adapter can render every promised slot.",
            ),
        );
    }

    for (const profileSlot of profileSlots) {
        if (!unstable_isKnownSlot(profileSlot)) {
            diagnostics.push(
                missingRequirement(
                    library,
                    `Profile '${library.profile}' promises unknown slot '${String(profileSlot)}'.`,
                    'Remove the unknown slot or install a Core version that declares it.',
                ),
            );
            continue;
        }

        const declaration = library.slots[profileSlot];
        if (!declaration || declaration.fidelity === 'unsupported') {
            diagnostics.push(
                missingRequirement(
                    library,
                    `Profile '${library.profile}' does not support promised slot '${profileSlot}'.`,
                    `Provide a supported '${profileSlot}' declaration or remove it from profileSlots.`,
                    profileSlot,
                ),
            );
        }
    }

    if (library.preflight) {
        try {
            diagnostics.push(...library.preflight());
        } catch (error: unknown) {
            diagnostics.push({
                code: unstable_adapterErrorCodes.missingUpstreamPeer,
                adapterId: library.id,
                message: `Renderer preflight failed: ${error instanceof Error ? error.message : String(error)}.`,
                remedy: 'Correct the renderer installation so its preflight can complete.',
            });
        }
    }

    return Object.freeze([...diagnostics]);
};

/** Compares normalized library identities without comparing or cloning manifest contents. */
export const unstable_sameLibraryReferences = (
    left: readonly unstable_UiLibrary[],
    right: readonly unstable_UiLibrary[],
): boolean =>
    left.length === right.length &&
    left.every((library, index) => library === right[index]);

/** Flattens outer-to-inner layers into one frozen, last-wins lookup table. */
export const unstable_createResolvedSlotTable = (
    layers: readonly unstable_RendererLayer[],
): unstable_SlotMap => {
    const resolved: Record<string, object> = {};
    for (const layer of layers) {
        for (const [slotId, declaration] of Object.entries(layer.slots)) {
            if (
                !declaration ||
                declaration.fidelity === 'unsupported' ||
                (layer.only && !layer.only.has(slotId as unstable_SlotId))
            )
                continue;
            resolved[slotId] = declaration;
        }
    }
    return Object.freeze(resolved) as unstable_SlotMap;
};

/** Resolves a slot through external layers, a facade-local Core declaration, then Core context. */
export const unstable_resolveSlot = <K extends unstable_SlotId>(
    slotId: K,
    slots: unstable_SlotMap,
    localCoreDeclaration: unstable_SlotDeclaration<K> | undefined,
    coreSlots: unstable_SlotMap,
): { declaration?: unstable_SlotDeclaration<K>; usedCoreFallback: boolean } => {
    const declaration = slots[slotId] as unstable_SlotDeclaration<K> | undefined;
    if (declaration) return { declaration, usedCoreFallback: false };

    return {
        declaration:
            localCoreDeclaration ??
            (coreSlots[slotId] as unstable_SlotDeclaration<K> | undefined),
        usedCoreFallback: true,
    };
};

/** Stable log key used to de-duplicate diagnostics within one provider identity. */
export const unstable_diagnosticKey = (diagnostic: unstable_AdapterDiagnostic): string =>
    [
        diagnostic.code,
        diagnostic.adapterId,
        diagnostic.slotId ?? '',
        diagnostic.message,
    ].join('|');

/** Emits one actionable renderer diagnostic without exposing manifest contents. */
export const unstable_logDiagnostic = (diagnostic: unstable_AdapterDiagnostic): void => {
    console.error(
        `[${diagnostic.code}] ${diagnostic.message} Remedy: ${diagnostic.remedy}`,
    );
};
