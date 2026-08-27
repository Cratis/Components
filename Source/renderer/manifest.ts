// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType, ReactNode } from 'react';
import type { unstable_CapabilityId } from './capabilities';
import type { unstable_AdapterDiagnostic } from './errors';
import type { unstable_SlotId, unstable_SlotMap } from './slots';

/**
 * Renderer ABI major implemented by this package.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export const unstable_CRATIS_UI_ABI_VERSION = 1;

/**
 * Runtime renderer manifest. Manifests are immutable values and are never passed through the
 * Components configuration deep-merge path.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export interface unstable_UiLibrary {
    /** Stable, package-local renderer identity used for diagnostics and telemetry. */
    readonly id: string;
    /** Human-readable renderer name. */
    readonly displayName: string;
    /** Renderer ABI major implemented by this library. */
    readonly abi: number;
    /** Breadth and ownership level offered by the library. */
    readonly level: 'full' | 'primitive' | 'behavior' | 'portal' | 'theme';
    /** Named contract profile promised by the library. */
    readonly profile: string;
    /**
     * Slots promised by the named profile. When omitted, the library promises its own slot keys.
     */
    readonly profileSlots?: readonly unstable_SlotId[];
    /** Core-owned capabilities honestly supported by the library. */
    readonly capabilities: readonly unstable_CapabilityId[];
    /** Typed partial slot implementation table. */
    readonly slots: unstable_SlotMap;
    /** Optional library-level provider mounted once around the selected renderer scope. */
    readonly Provider?: ComponentType<{ children: ReactNode }>;
    /** Optional static diagnostic preflight evaluated by renderer providers and scopes. */
    readonly preflight?: () => readonly unstable_AdapterDiagnostic[];
}

/**
 * Open declaration-merging surface for deliberate renderer-specific props. Core ships no keys, so
 * its declarations contain no vendor types.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
// Adapter packages add only their own vendor key through declaration merging.
// biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires an interface.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface unstable_RendererExtensions extends Record<never, never> {}

/**
 * Deliberate renderer lock-in bag derived only from declaration-merged extension keys. Portable
 * customization continues to use each component's `pt` contract.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_RendererProps = {
    [R in keyof unstable_RendererExtensions]?: Partial<unstable_RendererExtensions[R]>;
};

const frozenSlots = (slots: unstable_SlotMap): unstable_SlotMap => {
    const copy: Record<string, object> = {};
    for (const [slotId, declaration] of Object.entries(slots)) {
        if (declaration) copy[slotId] = Object.freeze({ ...declaration });
    }
    return Object.freeze(copy) as unstable_SlotMap;
};

/**
 * Defines a renderer library while preserving its inferred literal type. The helper is
 * side-effect-free and defensively copies/freezes mutable manifest containers; component and
 * callback references remain untouched.
 *
 * @param library Renderer library to define.
 * @returns A frozen defensive copy with the same inferred public type.
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export const unstable_defineUiLibrary = <const T extends unstable_UiLibrary>(
    library: T,
): T =>
    Object.freeze({
        ...library,
        capabilities: Object.freeze([...library.capabilities]),
        profileSlots: Object.freeze([
            ...(library.profileSlots ?? Object.keys(library.slots)),
        ]),
        slots: frozenSlots(library.slots),
    }) as T;

/**
 * Composes one or more renderer libraries. Slot declarations and metadata use last-library-wins
 * semantics; capabilities are de-duplicated in first-seen order for deterministic diagnostics.
 * The result is defensively copied and frozen through {@link unstable_defineUiLibrary}.
 *
 * @param libraries Libraries in increasing precedence order.
 * @returns One frozen renderer library containing the union of capabilities and slots.
 * @throws {RangeError} When no libraries are supplied.
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export const unstable_composeUiLibraries = (
    ...libraries: readonly unstable_UiLibrary[]
): unstable_UiLibrary => {
    if (libraries.length === 0) {
        throw new RangeError('At least one UI library is required for composition.');
    }

    const last = libraries[libraries.length - 1];
    const capabilities = [
        ...new Set(libraries.flatMap((library) => library.capabilities)),
    ];
    const slots = Object.assign({}, ...libraries.map((library) => library.slots));

    return unstable_defineUiLibrary({
        ...last,
        capabilities,
        profileSlots: last.profileSlots ?? (Object.keys(slots) as unstable_SlotId[]),
        slots,
    });
};
