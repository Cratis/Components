// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { ButtonProps } from '../Common/Button';
import type { CheckboxProps } from '../Common/Checkbox';
import type { IconButtonProps } from '../Common/IconButton';
import type { RadioProps } from '../Common/Radio';
import type { SurfaceProps } from '../Common/Surface';
import type { SwitchProps } from '../Common/Switch';
import type { TextAreaProps } from '../Common/TextArea';
import type { TextInputProps } from '../Common/TextInput';
import type { TablePaginatorProps } from '../DataTables/TablePaginator';
import type { ProgressBarProps } from '../Display/ProgressBar';
import type { CratisPresentationUiLibraryProviderProps } from './manifest';
import type { unstable_SlotMap } from './slots';

/** Stable renderer profile implemented by certified presentation adapters. */
export const CRATIS_PRESENTATION_PROFILE = 'stable-presentation/v1' as const;

/** Renderer ABI major for the stable presentation profile. */
export const CRATIS_PRESENTATION_ABI_VERSION = 1 as const;

/** Immutable, canonical slot order for the stable presentation profile. */
export const cratisPresentationSlotIds = Object.freeze([
    'common.button',
    'common.iconButton',
    'common.textInput',
    'common.textArea',
    'common.checkbox',
    'common.radio',
    'common.switch',
    'common.progress',
    'common.surface',
] as const);

/** Identifier of one stable presentation slot. */
export type CratisPresentationSlotId = (typeof cratisPresentationSlotIds)[number];

/** Exact public component prop and ref contracts covered by the stable presentation profile. */
export interface CratisPresentationSlots {
    /** Cratis button presentation contract, including native button refs and form behavior. */
    readonly 'common.button': ButtonProps;
    /** Accessible icon-only button contract with native button ownership. */
    readonly 'common.iconButton': IconButtonProps;
    /** Native text-input contract with semantic value-first change events. */
    readonly 'common.textInput': TextInputProps;
    /** Native multiline text-input contract with semantic value-first change events. */
    readonly 'common.textArea': TextAreaProps;
    /** Native checkbox contract with checked state, form participation, and input refs. */
    readonly 'common.checkbox': CheckboxProps;
    /** Native radio-option contract with selection state, form participation, and input refs. */
    readonly 'common.radio': RadioProps;
    /** Boolean switch contract preserving switch semantics and input ownership. */
    readonly 'common.switch': SwitchProps;
    /** Determinate or indeterminate progress presentation contract. */
    readonly 'common.progress': ProgressBarProps;
    /** Non-interactive semantic surface and native-element presentation contract. */
    readonly 'common.surface': SurfaceProps;
}

/** One stable, presentation-owned renderer slot declaration. */
export interface CratisPresentationSlotDeclaration<
    SlotId extends CratisPresentationSlotId,
> {
    /** Stable presentation slots always preserve Components behavior ownership. */
    readonly mode: 'presentation';
    /** Unsupported declarations cannot claim the stable profile. */
    readonly fidelity: 'native' | 'emulated';
    /** Component implementing the slot's exact public props and ref contract. */
    readonly render: ComponentType<CratisPresentationSlots[SlotId]>;
}

/** Complete implementation table required by the stable presentation profile. */
export type CratisPresentationSlotMap = {
    readonly [
        SlotId in CratisPresentationSlotId
    ]: CratisPresentationSlotDeclaration<SlotId>;
};

/**
 * Immutable list of the atomic slots whose contracts are stable. A stable presentation library may
 * implement any of them through {@link CratisPresentationUiLibrary.atomicSlots}; new ids are only
 * ever appended.
 */
export const cratisAtomicSlotIds = Object.freeze(['datatables.paginator'] as const);

/** Identifier of one stable atomic slot. */
export type CratisAtomicSlotId = (typeof cratisAtomicSlotIds)[number];

/** Exact public component prop contracts covered by the stable atomic slots. */
export interface CratisAtomicSlots {
    /**
     * Table paginator contract: zero-based `page`, `pageCount`, zero-based `onPageChange`, the
     * `TablePaginatorParts` parts and no ref.
     */
    readonly 'datatables.paginator': TablePaginatorProps;
}

/** One stable, adapter-owned atomic slot declaration. */
export interface CratisAtomicSlotDeclaration<SlotId extends CratisAtomicSlotId> {
    /** Stable atomic slots give the adapter ownership of the complete interaction. */
    readonly mode: 'atomic';
    /** Unsupported declarations are expressed by omitting the slot. */
    readonly fidelity: 'native' | 'emulated';
    /** Component implementing the slot's exact public props contract. */
    readonly render: ComponentType<CratisAtomicSlots[SlotId]>;
}

/** Optional atomic implementations. An omitted slot keeps the built-in Components implementation. */
export type CratisAtomicSlotMap = {
    readonly [SlotId in CratisAtomicSlotId]?: CratisAtomicSlotDeclaration<SlotId>;
};

/** Capabilities whose meaning is stable for the bounded presentation profile. */
export type CratisPresentationCapabilityId =
    | 'slot.render'
    | 'parts.passthrough'
    | 'ssr.staticRender'
    | 'rtl'
    | 'forcedColors'
    | 'motion.reduced';

type CratisPresentationOptionalCapabilityId = Exclude<
    CratisPresentationCapabilityId,
    'slot.render' | 'parts.passthrough' | 'ssr.staticRender'
>;

/** Required presentation capabilities followed by optional stable evidence capabilities. */
export type CratisPresentationCapabilities = readonly [
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
    ...CratisPresentationOptionalCapabilityId[],
];

/** Immutable manifest for one implementation of the stable presentation profile. */
export interface CratisPresentationUiLibrary {
    /** Stable, package-local renderer identity used for diagnostics and telemetry. */
    readonly id: string;
    /** Human-readable renderer name. */
    readonly displayName: string;
    /** Stable presentation renderer ABI major. */
    readonly abi: typeof CRATIS_PRESENTATION_ABI_VERSION;
    /** The bounded profile is a primitive presentation adapter. */
    readonly level: 'primitive';
    /** Exact stable presentation profile identifier. */
    readonly profile: typeof CRATIS_PRESENTATION_PROFILE;
    /** Canonical immutable list of all nine stable slots. */
    readonly profileSlots: typeof cratisPresentationSlotIds;
    /** Required presentation capabilities followed by any optional stable capabilities. */
    readonly capabilities: CratisPresentationCapabilities;
    /** Complete nine-slot presentation implementation. */
    readonly slots: CratisPresentationSlotMap;
    /** Optional provider mounted once around the selected renderer scope. */
    readonly Provider?: ComponentType<CratisPresentationUiLibraryProviderProps>;
    /**
     * Optional adapter-owned implementations of stable atomic slots. Omitted slots resolve to the
     * built-in Components implementation.
     */
    readonly atomicSlots?: CratisAtomicSlotMap;
}

const requiredCapabilityIds = [
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] as const;

const stableCapabilityIds = new Set<CratisPresentationCapabilityId>([
    ...requiredCapabilityIds,
    'rtl',
    'forcedColors',
    'motion.reduced',
]);

const invalidPresentationLibrary: (reason: string) => never = (reason) => {
    throw new TypeError(`Invalid stable presentation UI library: ${reason}.`);
};

const hasCanonicalProfileSlots = (profileSlots: readonly unknown[]): boolean =>
    profileSlots.length === cratisPresentationSlotIds.length &&
    profileSlots.every((slotId, index) => slotId === cratisPresentationSlotIds[index]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const isRendererIdentity = (id: unknown): boolean =>
    typeof id === 'string' &&
    id.length <= 128 &&
    /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u.test(id);

const isDisplayName = (displayName: unknown): boolean =>
    typeof displayName === 'string' &&
    displayName.trim().length > 0 &&
    displayName.length <= 128;

const isComponent = (render: unknown): boolean =>
    render !== null && (typeof render === 'function' || typeof render === 'object');

const isStableFidelity = (fidelity: unknown): boolean =>
    fidelity === 'native' || fidelity === 'emulated';

const validateIdentity = (library: CratisPresentationUiLibrary) => {
    if (library === null || typeof library !== 'object') {
        invalidPresentationLibrary('manifest must be an object');
    }
    if (!isRendererIdentity(library.id)) {
        invalidPresentationLibrary('id must be a valid package-local renderer identity');
    }
    if (!isDisplayName(library.displayName)) {
        invalidPresentationLibrary(
            'displayName must contain between 1 and 128 characters',
        );
    }
    if (library.Provider !== undefined && typeof library.Provider !== 'function') {
        invalidPresentationLibrary('Provider must be a React component when supplied');
    }
};

const validateProfile = (library: CratisPresentationUiLibrary) => {
    if (library.profile !== CRATIS_PRESENTATION_PROFILE) {
        invalidPresentationLibrary(`profile must be '${CRATIS_PRESENTATION_PROFILE}'`);
    }
    if (library.abi !== CRATIS_PRESENTATION_ABI_VERSION) {
        invalidPresentationLibrary(`ABI must be ${CRATIS_PRESENTATION_ABI_VERSION}`);
    }
    if (library.level !== 'primitive') {
        invalidPresentationLibrary("level must be 'primitive'");
    }
    if (
        !Array.isArray(library.profileSlots) ||
        !hasCanonicalProfileSlots(library.profileSlots)
    ) {
        invalidPresentationLibrary(
            'profileSlots must be the canonical nine-slot profile',
        );
    }
};

const validateDeclaration = (
    declaration: Record<string, unknown>,
    label: string,
    mode: 'presentation' | 'atomic',
) => {
    if (declaration.mode !== mode) {
        invalidPresentationLibrary(`${label} must use ${mode} mode`);
    }
    if (!isStableFidelity(declaration.fidelity)) {
        invalidPresentationLibrary(`${label} must use native or emulated fidelity`);
    }
    if (!isComponent(declaration.render)) {
        invalidPresentationLibrary(`${label} must provide a component`);
    }
};

const validateSlots = (library: CratisPresentationUiLibrary) => {
    if (!library.slots || typeof library.slots !== 'object') {
        invalidPresentationLibrary('slots must be an object');
    }

    const slotIds = Object.keys(library.slots);
    if (
        slotIds.length !== cratisPresentationSlotIds.length ||
        cratisPresentationSlotIds.some((slotId) => !slotIds.includes(slotId))
    ) {
        invalidPresentationLibrary(
            'slots must contain exactly the nine stable presentation slots',
        );
    }

    for (const slotId of cratisPresentationSlotIds) {
        // SAFETY: the canonical slot list indexes the complete stable map; the wider record view
        // exists only so runtime JavaScript callers can be checked before their value is frozen.
        const declaration = library.slots[slotId] as unknown as
            Record<string, unknown> | undefined;
        if (!declaration) {
            invalidPresentationLibrary(`slot '${slotId}' must provide a declaration`);
        }
        validateDeclaration(declaration, `slot '${slotId}'`, 'presentation');
    }
};

const validateCapabilities = (library: CratisPresentationUiLibrary) => {
    if (
        !Array.isArray(library.capabilities) ||
        library.capabilities.some((capability) => !stableCapabilityIds.has(capability))
    ) {
        invalidPresentationLibrary(
            'capabilities must stay within the stable presentation subset',
        );
    }
    if (
        requiredCapabilityIds.some(
            (capability, index) => library.capabilities[index] !== capability,
        )
    ) {
        invalidPresentationLibrary(
            'capabilities must begin with slot.render, parts.passthrough, and ssr.staticRender',
        );
    }
    if (new Set(library.capabilities).size !== library.capabilities.length) {
        invalidPresentationLibrary('capabilities must not contain duplicates');
    }
};

const isStableAtomicSlotId = (slotId: string): slotId is CratisAtomicSlotId =>
    (cratisAtomicSlotIds as readonly string[]).includes(slotId);

const validateAtomicSlots = (atomicSlots: unknown) => {
    if (atomicSlots === undefined) return;
    if (!isRecord(atomicSlots)) {
        invalidPresentationLibrary('atomicSlots must be an object when supplied');
    }
    for (const [slotId, declaration] of Object.entries(atomicSlots)) {
        if (!isStableAtomicSlotId(slotId)) {
            invalidPresentationLibrary(`atomic slot '${slotId}' is not a stable atomic slot`);
        }
        if (declaration === undefined) continue;
        if (!isRecord(declaration)) {
            invalidPresentationLibrary(`atomic slot '${slotId}' must provide a declaration`);
        }
        validateDeclaration(declaration, `atomic slot '${slotId}'`, 'atomic');
    }
};

const freezeDeclaration = <
    Declaration extends {
        readonly mode: string;
        readonly fidelity: string;
        readonly render: unknown;
    },
>(
    declaration: Declaration,
): Declaration =>
    Object.freeze({
        mode: declaration.mode,
        fidelity: declaration.fidelity,
        render: declaration.render,
    }) as Declaration;

const freezePresentationSlots = (
    slots: CratisPresentationSlotMap,
): CratisPresentationSlotMap =>
    Object.freeze(
        Object.fromEntries(
            cratisPresentationSlotIds.map((slotId) => [
                slotId,
                freezeDeclaration(slots[slotId]),
            ]),
        ),
    ) as CratisPresentationSlotMap;

const freezeAtomicSlots = (atomicSlots: CratisAtomicSlotMap): CratisAtomicSlotMap =>
    Object.freeze(
        Object.fromEntries(
            cratisAtomicSlotIds.flatMap((slotId) => {
                const declaration = atomicSlots[slotId];
                return declaration ? [[slotId, freezeDeclaration(declaration)]] : [];
            }),
        ),
    ) as CratisAtomicSlotMap;

/**
 * Defines and freezes a complete implementation of the stable nine-slot presentation profile,
 * plus any optional stable atomic slots. Runtime validation protects JavaScript callers from
 * claiming a profile they do not implement.
 *
 * @param library Stable presentation library declaration.
 * @returns A defensive, deeply frozen manifest copy.
 */
export const definePresentationUiLibrary = (
    library: CratisPresentationUiLibrary,
): CratisPresentationUiLibrary => {
    validateIdentity(library);
    validateProfile(library);
    validateSlots(library);
    validateCapabilities(library);
    validateAtomicSlots(library.atomicSlots);

    return Object.freeze({
        id: library.id,
        displayName: library.displayName,
        abi: library.abi,
        level: library.level,
        profile: library.profile,
        profileSlots: cratisPresentationSlotIds,
        capabilities: Object.freeze([
            ...library.capabilities,
        ]) as CratisPresentationCapabilities,
        slots: freezePresentationSlots(library.slots),
        Provider: library.Provider,
        ...(library.atomicSlots === undefined
            ? {}
            : { atomicSlots: freezeAtomicSlots(library.atomicSlots) }),
    });
};

const isStableAtomicDeclaration = (declaration: unknown): boolean =>
    isRecord(declaration) && declaration.mode === 'atomic';

/**
 * Returns the stable atomic slot declarations a stable presentation library adds to resolution.
 * Libraries of any other profile, and libraries without `atomicSlots`, contribute nothing, so
 * their slot tables resolve exactly as before.
 *
 * @param library Renderer library being resolved.
 * @returns The library's stable atomic declarations keyed by slot id; empty when it has none.
 * @internal Resolution helper; not part of the public package surface.
 */
export const stableAtomicSlotsOf = (library: {
    readonly profile: string;
}): unstable_SlotMap => {
    if (library.profile !== CRATIS_PRESENTATION_PROFILE) return {};
    const { atomicSlots } = library as { readonly atomicSlots?: unknown };
    if (!isRecord(atomicSlots)) return {};

    return Object.fromEntries(
        cratisAtomicSlotIds
            .map((slotId) => [slotId, atomicSlots[slotId]] as const)
            .filter(([, declaration]) => isStableAtomicDeclaration(declaration)),
    ) as unstable_SlotMap;
};
