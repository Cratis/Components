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
import type { ProgressBarProps } from '../Display/ProgressBar';
import {
    unstable_defineUiLibrary,
    type CratisPresentationUiLibraryProviderProps,
    type unstable_UiLibrary,
} from './manifest';

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

const invalidPresentationLibrary = (reason: string): never => {
    throw new TypeError(`Invalid stable presentation UI library: ${reason}.`);
};

const hasCanonicalProfileSlots = (profileSlots: readonly unknown[]): boolean =>
    profileSlots.length === cratisPresentationSlotIds.length &&
    profileSlots.every((slotId, index) => slotId === cratisPresentationSlotIds[index]);

/**
 * Defines and freezes a complete implementation of the stable nine-slot presentation profile.
 * Runtime validation protects JavaScript callers from claiming a profile they do not implement.
 *
 * @param library Stable presentation library declaration.
 * @returns A defensive, deeply frozen manifest copy.
 */
export const definePresentationUiLibrary = <
    const Library extends CratisPresentationUiLibrary,
>(
    library: Library,
): Library => {
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
            throw new TypeError(
                `Invalid stable presentation UI library: slot '${slotId}' must provide a declaration.`,
            );
        }
        if (declaration.mode !== 'presentation') {
            invalidPresentationLibrary(`slot '${slotId}' must use presentation mode`);
        }
        if (declaration.fidelity !== 'native' && declaration.fidelity !== 'emulated') {
            invalidPresentationLibrary(
                `slot '${slotId}' must use native or emulated fidelity`,
            );
        }
        if (
            declaration.render === null ||
            (typeof declaration.render !== 'function' &&
                typeof declaration.render !== 'object')
        ) {
            invalidPresentationLibrary(`slot '${slotId}' must provide a component`);
        }
    }

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
            (capability) => !library.capabilities.includes(capability),
        )
    ) {
        invalidPresentationLibrary(
            'capabilities must include slot.render, parts.passthrough, and ssr.staticRender',
        );
    }
    if (new Set(library.capabilities).size !== library.capabilities.length) {
        invalidPresentationLibrary('capabilities must not contain duplicates');
    }

    // SAFETY: every stable field and all nine declarations were validated above, so the manifest
    // satisfies the broader internal library shape without admitting an atomic or unknown slot.
    const unstableLibrary = library as unknown as unstable_UiLibrary;
    const frozenLibrary = unstable_defineUiLibrary(unstableLibrary);
    // SAFETY: the shared freezer copies values without changing the validated stable shape.
    return frozenLibrary as unknown as Library;
};
