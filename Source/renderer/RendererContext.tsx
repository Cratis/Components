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
import type { unstable_RendererSetup, unstable_UiLibrary } from './manifest';
import {
    unstable_defaultOverlayEnvironment,
    type unstable_CratisOverlayEnvironment,
} from './overlayEnvironment';
import {
    unstable_createResolvedSlotTable,
    unstable_diagnosticKey,
    unstable_emptyCoreRendererSlots,
    unstable_logDiagnostic,
    unstable_resolveLibraryInput,
    unstable_resolveSlot,
    type unstable_RendererLayer,
} from './resolve';
import {
    createSelectedLayer,
    diagnoseSelectedLibraries,
    resolveCoreSlots,
    resolveOverlayEnvironment,
    resolveProviderLibraryReferences,
    resolveRendererSetup,
    stackRendererLayers,
} from './rendererRootState';
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
    readonly rendererSetup: unstable_RendererSetup;
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
    /** Non-secret application setup attestations supplied to the selected library provider. */
    readonly rendererSetup?: unstable_RendererSetup;
    readonly coreSlots?: unstable_SlotMap;
    readonly children: ReactNode;
}

/** One source-owned context singleton. It is deliberately not exported from the renderer barrel. */
export const unstable_RendererContext = createContext<
    unstable_RendererContextValue | undefined
>(undefined);

/** Stands in for a missing parent so every inherited field reads as undefined. */
const noParentRendererState: Partial<unstable_RendererContextValue> = Object.freeze({});

/** Reports each distinct diagnostic once for the lifetime of the root. */
const useDiagnosticReporter = () => {
    const reportedDiagnostics = useRef(new Set<string>());
    return useCallback((diagnostic: unstable_AdapterDiagnostic) => {
        const key = unstable_diagnosticKey(diagnostic);
        if (reportedDiagnostics.current.has(key)) return;
        reportedDiagnostics.current.add(key);
        unstable_logDiagnostic(diagnostic);
    }, []);
};

/** Internal root boundary. Renderer manifests remain outside Components configuration merging. */
export const unstable_RendererRoot = ({
    library,
    libraryMode = 'strict',
    rendererFallback = 'core',
    overlayEnvironment,
    rendererSetup,
    coreSlots,
    children,
}: unstable_RendererRootProps) => {
    const parent: Partial<unstable_RendererContextValue> =
        useContext(unstable_RendererContext) ?? noParentRendererState;
    const selected = useMemo(() => unstable_resolveLibraryInput(library), [library]);
    const setup = useMemo(
        () => resolveRendererSetup(rendererSetup, parent.rendererSetup),
        [parent.rendererSetup, rendererSetup],
    );
    const layer = useMemo(() => createSelectedLayer(selected), [selected]);
    const reportDiagnostic = useDiagnosticReporter();

    const diagnostics = useMemo(
        () => diagnoseSelectedLibraries(selected, parent.providerLibraryReferences),
        [parent.providerLibraryReferences, selected],
    );

    useEffect(() => {
        if (libraryMode === 'degrade') {
            diagnostics.forEach(reportDiagnostic);
        }
    }, [diagnostics, libraryMode, reportDiagnostic]);

    const layers = useMemo(
        () => stackRendererLayers(parent.layers, layer),
        [layer, parent.layers],
    );
    const slots = useMemo(() => unstable_createResolvedSlotTable(layers), [layers]);
    const resolvedCoreSlots = useMemo(
        () => resolveCoreSlots(coreSlots, parent.coreSlots),
        [coreSlots, parent.coreSlots],
    );
    const value = useMemo<unstable_RendererContextValue>(
        () =>
            Object.freeze({
                layers,
                slots,
                libraryMode,
                rendererFallback,
                overlayEnvironment: resolveOverlayEnvironment(
                    overlayEnvironment,
                    parent.overlayEnvironment,
                ),
                rendererSetup: setup,
                coreSlots: resolvedCoreSlots,
                providerLibraryReferences: resolveProviderLibraryReferences(
                    selected.references,
                    parent.providerLibraryReferences,
                ),
                reportDiagnostic,
            }),
        [
            layers,
            libraryMode,
            overlayEnvironment,
            parent.overlayEnvironment,
            parent.providerLibraryReferences,
            rendererFallback,
            reportDiagnostic,
            resolvedCoreSlots,
            selected.references,
            setup,
            slots,
        ],
    );

    if (libraryMode === 'strict' && diagnostics.length > 0) {
        throw new unstable_AdapterError(diagnostics[0]);
    }

    const LibraryProvider = selected.library?.Provider;
    return (
        <unstable_RendererContext.Provider value={value}>
            {LibraryProvider ? (
                <LibraryProvider setup={setup}>{children}</LibraryProvider>
            ) : (
                children
            )}
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
 * Resolves one slot through scopes/provider, a facade-local Core declaration, then Core context.
 *
 * @unstable Internal component-routing contract for Slice E. Expect changes until renderer
 * conformance gates promote it.
 */
export function unstable_useSlot<K extends unstable_SlotId>(
    slotId: K,
    localCoreDeclaration: unstable_SlotDeclaration<K>,
): unstable_SlotDeclaration<K>;
export function unstable_useSlot<K extends unstable_SlotId>(
    slotId: K,
): unstable_SlotDeclaration<K> | undefined;
export function unstable_useSlot<K extends unstable_SlotId>(
    slotId: K,
    localCoreDeclaration?: unstable_SlotDeclaration<K>,
): unstable_SlotDeclaration<K> | undefined {
    const context = useContext(unstable_RendererContext);
    const result = unstable_resolveSlot(
        slotId,
        context?.slots ?? unstable_emptyCoreRendererSlots,
        localCoreDeclaration,
        context?.coreSlots ?? unstable_emptyCoreRendererSlots,
    );

    // Permitted Core fallback is successful resolution, not a renderer error. Provider/scope
    // validation still reports invalid profile promises, independently of fallback policy.
    if (result.usedCoreFallback && (context?.rendererFallback ?? 'core') === 'throw') {
        throw new unstable_AdapterError(fallbackDiagnostic(context, slotId));
    }

    return result.declaration;
}

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
