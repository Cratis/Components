// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from 'react';
import type { unstable_CapabilityId } from './capabilities';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type unstable_AdapterDiagnostic,
} from './errors';
import type { unstable_UiLibrary } from './manifest';
import {
    unstable_defaultOverlayEnvironment,
    type unstable_CratisOverlayEnvironment,
} from './overlayEnvironment';
import {
    unstable_createRendererLayer,
    unstable_createResolvedSlotTable,
    unstable_diagnosticKey,
    unstable_emptyCoreRendererSlots,
    unstable_logDiagnostic,
    unstable_resolveLibraryInput,
    unstable_resolveSlot,
    unstable_sameLibraryReferences,
    unstable_validateUiLibrary,
    type unstable_RendererLayer,
} from './resolve';
import type {
    unstable_SlotDeclaration,
    unstable_SlotId,
    unstable_SlotMap,
} from './slots';

/** Internal renderer state shared by the provider and nested scopes. */
export interface unstable_RendererContextValue {
    readonly layers: readonly unstable_RendererLayer[];
    readonly slots: unstable_SlotMap;
    readonly libraryMode: 'strict' | 'degrade';
    readonly rendererFallback: 'core' | 'throw';
    readonly overlayEnvironment: unstable_CratisOverlayEnvironment;
    readonly coreSlots: unstable_SlotMap;
    readonly providerLibraryReferences: readonly unstable_UiLibrary[];
    readonly reportDiagnostic: (diagnostic: unstable_AdapterDiagnostic) => void;
}

/** Props for the internal renderer boundary mounted by the setup provider. */
export interface unstable_RendererRootProps {
    readonly library?: unstable_UiLibrary | readonly unstable_UiLibrary[];
    readonly libraryMode?: 'strict' | 'degrade';
    readonly rendererFallback?: 'core' | 'throw';
    readonly overlayEnvironment?: unstable_CratisOverlayEnvironment;
    readonly coreSlots?: unstable_SlotMap;
    readonly children: ReactNode;
}

/** One source-owned context singleton. It is deliberately not exported from the renderer barrel. */
export const unstable_RendererContext = createContext<
    unstable_RendererContextValue | undefined
>(undefined);

const nestedLibraryDiagnostic = (
    library: unstable_UiLibrary,
): unstable_AdapterDiagnostic => ({
    code: unstable_adapterErrorCodes.nestedLibraries,
    adapterId: library.id,
    message: 'A nested CratisComponentsProvider selected a conflicting renderer library.',
    remedy: 'Select renderer libraries once at the application provider and use RendererScope for local overrides.',
});

/** Internal root boundary. Renderer manifests remain outside Components configuration merging. */
export const unstable_RendererRoot = ({
    library,
    libraryMode = 'strict',
    rendererFallback = 'core',
    overlayEnvironment,
    coreSlots,
    children,
}: unstable_RendererRootProps) => {
    const parent = useContext(unstable_RendererContext);
    const selected = useMemo(() => unstable_resolveLibraryInput(library), [library]);
    const layer = useMemo(
        () =>
            selected.library ? unstable_createRendererLayer(selected.library) : undefined,
        [selected],
    );
    const reportedDiagnostics = useRef(new Set<string>());
    const reportDiagnostic = useCallback((diagnostic: unstable_AdapterDiagnostic) => {
        const key = unstable_diagnosticKey(diagnostic);
        if (reportedDiagnostics.current.has(key)) return;
        reportedDiagnostics.current.add(key);
        unstable_logDiagnostic(diagnostic);
    }, []);

    const diagnostics = useMemo(() => {
        if (!selected.library)
            return Object.freeze([]) as readonly unstable_AdapterDiagnostic[];

        const currentDiagnostics = selected.references.flatMap((reference) =>
            unstable_validateUiLibrary(reference),
        );
        if (
            parent?.providerLibraryReferences.length &&
            !unstable_sameLibraryReferences(
                parent.providerLibraryReferences,
                selected.references,
            )
        ) {
            currentDiagnostics.unshift(nestedLibraryDiagnostic(selected.library));
        }
        return Object.freeze(currentDiagnostics);
    }, [parent?.providerLibraryReferences, selected]);

    useEffect(() => {
        if (libraryMode === 'degrade') {
            diagnostics.forEach(reportDiagnostic);
        }
    }, [diagnostics, libraryMode, reportDiagnostic]);

    const layers = useMemo(
        () => Object.freeze([...(parent?.layers ?? []), ...(layer ? [layer] : [])]),
        [layer, parent?.layers],
    );
    const slots = useMemo(() => unstable_createResolvedSlotTable(layers), [layers]);
    const resolvedCoreSlots = useMemo(
        () =>
            coreSlots
                ? Object.freeze({ ...coreSlots })
                : (parent?.coreSlots ?? unstable_emptyCoreRendererSlots),
        [coreSlots, parent?.coreSlots],
    );
    const value = useMemo<unstable_RendererContextValue>(
        () =>
            Object.freeze({
                layers,
                slots,
                libraryMode,
                rendererFallback,
                overlayEnvironment:
                    overlayEnvironment ??
                    parent?.overlayEnvironment ??
                    unstable_defaultOverlayEnvironment,
                coreSlots: resolvedCoreSlots,
                providerLibraryReferences:
                    selected.references.length > 0
                        ? selected.references
                        : (parent?.providerLibraryReferences ?? selected.references),
                reportDiagnostic,
            }),
        [
            layers,
            libraryMode,
            overlayEnvironment,
            parent?.overlayEnvironment,
            parent?.providerLibraryReferences,
            rendererFallback,
            reportDiagnostic,
            resolvedCoreSlots,
            selected.references,
            slots,
        ],
    );

    if (libraryMode === 'strict' && diagnostics.length > 0) {
        throw new unstable_AdapterError(diagnostics[0]);
    }

    const LibraryProvider = selected.library?.Provider;
    return (
        <unstable_RendererContext.Provider value={value}>
            {LibraryProvider ? <LibraryProvider>{children}</LibraryProvider> : children}
        </unstable_RendererContext.Provider>
    );
};

const fallbackDiagnostic = (
    context: unstable_RendererContextValue | undefined,
    slotId: unstable_SlotId,
): unstable_AdapterDiagnostic => ({
    code: unstable_adapterErrorCodes.strictProfileFallback,
    adapterId: context?.layers[context.layers.length - 1]?.library.id ?? 'core',
    slotId,
    message: `Renderer resolution requested Core fallback for slot '${slotId}'.`,
    remedy: `Provide a supported '${slotId}' renderer declaration or intentionally retain the Core fallback.`,
});

/**
 * Resolves one slot through scopes, the application provider, and the Core fallback table.
 *
 * @unstable Internal component-routing contract for Slice E. Expect changes until renderer
 * conformance gates promote it.
 */
export const unstable_useSlot = <K extends unstable_SlotId>(
    slotId: K,
): unstable_SlotDeclaration<K> | undefined => {
    const context = useContext(unstable_RendererContext);
    const localReportedDiagnostics = useRef(new Set<string>());
    const result = unstable_resolveSlot(
        slotId,
        context?.slots ?? unstable_emptyCoreRendererSlots,
        context?.coreSlots ?? unstable_emptyCoreRendererSlots,
    );

    const diagnostic =
        result.usedCoreFallback && (context?.layers.length ?? 0) > 0
            ? fallbackDiagnostic(context, slotId)
            : undefined;

    useEffect(() => {
        if (!diagnostic) return;
        if (context) {
            context.reportDiagnostic(diagnostic);
            return;
        }
        const key = unstable_diagnosticKey(diagnostic);
        if (!localReportedDiagnostics.current.has(key)) {
            localReportedDiagnostics.current.add(key);
            unstable_logDiagnostic(diagnostic);
        }
    }, [context, diagnostic]);

    if (!result.declaration && (context?.rendererFallback ?? 'core') === 'throw') {
        throw new unstable_AdapterError(
            diagnostic ?? fallbackDiagnostic(context, slotId),
        );
    }

    return result.declaration;
};

/** Returns whether any active renderer layer advertises a Core-owned capability. */
export const unstable_useCapability = (capability: unstable_CapabilityId): boolean => {
    const context = useContext(unstable_RendererContext);
    return (
        context?.layers.some((layer) =>
            layer.library.capabilities.includes(capability),
        ) ?? false
    );
};

/**
 * Returns the nearest renderer identity for telemetry only. Behavior must branch on capabilities.
 */
export const unstable_useRendererId = (): string => {
    const context = useContext(unstable_RendererContext);
    return context?.layers[context.layers.length - 1]?.library.id ?? 'core';
};

/** Internal overlay hook. Reading it never invokes getContainer during render or SSR. */
export const unstable_useOverlayEnvironment = (): unstable_CratisOverlayEnvironment =>
    useContext(unstable_RendererContext)?.overlayEnvironment ??
    unstable_defaultOverlayEnvironment;
