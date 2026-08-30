// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useContext, useEffect, useMemo, type ReactNode } from 'react';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type unstable_AdapterDiagnostic,
} from './errors';
import type { unstable_UiLibrary } from './manifest';
import {
    unstable_createRendererLayer,
    unstable_createResolvedSlotTable,
    unstable_isKnownSlot,
    unstable_resolveLibraryInput,
    unstable_validateUiLibrary,
} from './resolve';
import {
    unstable_RendererContext,
    type unstable_RendererContextValue,
} from './RendererContext';
import type { unstable_SlotId } from './slots';

/** Props for a local renderer override. */
export interface unstable_RendererScopeProps {
    /** One renderer or an ordered last-wins composition used in this subtree. */
    readonly use: unstable_UiLibrary | readonly unstable_UiLibrary[];
    /** Optional slot allow-list. Other slots continue through outer scopes and the provider. */
    readonly only?: readonly unstable_SlotId[];
    /** Scoped application content. */
    readonly children: ReactNode;
}

const invalidOnlyDiagnostic = (
    library: unstable_UiLibrary,
    slotId: unknown,
): unstable_AdapterDiagnostic => ({
    code: unstable_adapterErrorCodes.missingRequirement,
    adapterId: library.id,
    message: `RendererScope only includes unknown slot '${String(slotId)}'.`,
    remedy: 'Use only slot identifiers declared by the installed Components version.',
});

/**
 * Applies a renderer locally. The nearest matching scope wins; `only` lets all other slots continue
 * through outer scopes and the application provider.
 *
 * @unstable Consumer contract. Expect changes until renderer conformance gates promote it.
 */
export const unstable_RendererScope = ({
    use,
    only,
    children,
}: unstable_RendererScopeProps) => {
    const parent = useContext(unstable_RendererContext);
    const selected = useMemo(() => unstable_resolveLibraryInput(use), [use]);
    const acceptedOnly = useMemo(() => only?.filter(unstable_isKnownSlot), [only]);
    const layer = useMemo(
        () =>
            selected.library
                ? unstable_createRendererLayer(selected.library, acceptedOnly)
                : undefined,
        [acceptedOnly, selected],
    );
    const diagnostics = useMemo(() => {
        if (!selected.library)
            return Object.freeze([]) as readonly unstable_AdapterDiagnostic[];
        return Object.freeze([
            ...selected.references.flatMap((reference) =>
                unstable_validateUiLibrary(reference),
            ),
            ...(only ?? [])
                .filter((slotId) => !unstable_isKnownSlot(slotId))
                .map((slotId) => invalidOnlyDiagnostic(selected.library!, slotId)),
        ]);
    }, [only, selected]);

    useEffect(() => {
        if (parent?.libraryMode === 'degrade') {
            diagnostics.forEach(parent.reportDiagnostic);
        }
    }, [diagnostics, parent]);

    const layers = useMemo(
        () => (parent && layer ? Object.freeze([...parent.layers, layer]) : undefined),
        [layer, parent],
    );
    const slots = useMemo(
        () => (layers ? unstable_createResolvedSlotTable(layers) : undefined),
        [layers],
    );
    const value = useMemo<unstable_RendererContextValue | undefined>(
        () =>
            parent && layers && slots
                ? Object.freeze({
                      ...parent,
                      layers,
                      slots,
                  })
                : undefined,
        [layers, parent, slots],
    );

    if ((parent?.libraryMode ?? 'strict') === 'strict' && diagnostics.length > 0) {
        throw new unstable_AdapterError(diagnostics[0]);
    }

    const LibraryProvider = selected.library?.Provider;

    if (!value) return children;

    return (
        <unstable_RendererContext.Provider value={value}>
            {LibraryProvider ? (
                <LibraryProvider setup={value.rendererSetup}>{children}</LibraryProvider>
            ) : (
                children
            )}
        </unstable_RendererContext.Provider>
    );
};
