// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { ButtonProps } from '../Common/Button';
import type { CheckboxProps } from '../Common/Checkbox';
import type { DatePickerInputProps } from '../Common/DatePickerInput';
import type { IconButtonProps } from '../Common/IconButton';
import type { RadioProps } from '../Common/Radio';
import type { SurfaceProps } from '../Common/Surface';
import type { SwitchProps } from '../Common/Switch';
import type { TextAreaProps } from '../Common/TextArea';
import type { TextInputProps } from '../Common/TextInput';
import type { TooltipProps } from '../Common/Tooltip';
import type { TablePaginatorProps } from '../DataTables/TablePaginator';
import type { CratisDialogSlotProps } from '../Dialogs/DialogHost';
import type { DropdownProps } from '../Dropdown/Dropdown';
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
export const cratisAtomicSlotIds = Object.freeze([
    'datatables.paginator',
    'common.tooltip',
    'dropdown.select',
    'display.datePicker',
    'dialogs.dialog',
] as const);

/** Identifier of one stable atomic slot. */
export type CratisAtomicSlotId = (typeof cratisAtomicSlotIds)[number];

/** Exact public component prop contracts covered by the stable atomic slots. */
export interface CratisAtomicSlots {
    /**
     * Table paginator contract: zero-based `page`, `pageCount`, zero-based `onPageChange`, the
     * `TablePaginatorParts` parts and no ref.
     */
    readonly 'datatables.paginator': TablePaginatorProps;
    /**
     * Tooltip contract: non-interactive `content`, `position`, `disabled`, `className` and exactly
     * one focusable trigger child. The adapter keeps the trigger's `data-cratis-part` and renders
     * the popup as the `popup` part; there is no ref.
     */
    readonly 'common.tooltip': TooltipProps;
    /**
     * Select contract: the public `DropdownProps` with an untyped value, the `DropdownParts` parts
     * and no ref. The adapter owns the trigger, filter, listbox, keyboard and selection callbacks.
     */
    readonly 'dropdown.select': DropdownProps<unknown>;
    /**
     * Date picker contract: the public `DatePickerInputProps` with `Date | null` values, the
     * `DatePickerInputPassThrough` parts and no ref. Calendar library values stay inside the adapter.
     */
    readonly 'display.datePicker': DatePickerInputProps;
    /**
     * Dialog contract: the public `DialogProps` plus a `host` prop (`CratisDialogHost`). Components
     * keeps the dialog stack, the result flow, the footer and header actions, busy and validity,
     * initial focus and the descendants' overlay environment. The adapter owns the modal shell:
     * focus trap, Escape, outside press, scroll lock and focus restoration. There is no ref.
     */
    readonly 'dialogs.dialog': CratisDialogSlotProps;
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

const declarationProblem = (
    declaration: Record<string, unknown>,
    label: string,
    mode: 'presentation' | 'atomic',
): string | undefined => {
    if (declaration.mode !== mode) return `${label} must use ${mode} mode`;
    if (!isStableFidelity(declaration.fidelity)) {
        return `${label} must use native or emulated fidelity`;
    }
    if (!isComponent(declaration.render)) return `${label} must provide a component`;
    return undefined;
};

const validateDeclaration = (
    declaration: Record<string, unknown>,
    label: string,
    mode: 'presentation' | 'atomic',
) => {
    const problem = declarationProblem(declaration, label, mode);
    if (problem) invalidPresentationLibrary(problem);
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

/** One atomic slot entry inspected from a single own-enumerable snapshot of `atomicSlots`. */
interface AtomicSlotEntry {
    readonly slotId: string;
    /** Declaration read exactly once, or undefined for an explicitly omitted slot. */
    readonly declaration?: Readonly<Record<string, unknown>>;
    /** Why the entry cannot be used; undefined when it is valid. */
    readonly problem?: string;
}

/** Inspection of a library's `atomicSlots`: one problem for the map, or one result per own key. */
interface AtomicSlotInspection {
    readonly problem?: string;
    readonly entries: readonly AtomicSlotEntry[];
}

const snapshotDeclaration = (declaration: Record<string, unknown>) => ({
    mode: declaration.mode,
    fidelity: declaration.fidelity,
    render: declaration.render,
});

const inspectAtomicSlot = (slotId: string, value: unknown): AtomicSlotEntry => {
    const label = `atomic slot '${slotId}'`;
    if (!isStableAtomicSlotId(slotId)) {
        return { slotId, problem: `${label} is not a stable atomic slot` };
    }
    if (value === undefined) return { slotId };
    if (!isRecord(value)) return { slotId, problem: `${label} must provide a declaration` };

    const declaration = snapshotDeclaration(value);
    return { slotId, declaration, problem: declarationProblem(declaration, label, 'atomic') };
};

const isPlainPrototype = (prototype: unknown): boolean =>
    prototype === null || prototype === Object.prototype;

/**
 * Inspects `atomicSlots` through ONE snapshot of its own enumerable keys, reading each value
 * once. Inherited and non-enumerable declarations never take part in validation or resolution.
 */
const inspectAtomicSlots = (atomicSlots: unknown): AtomicSlotInspection => {
    if (atomicSlots === undefined) return { entries: [] };
    if (!isRecord(atomicSlots)) {
        return { problem: 'atomicSlots must be an object when supplied', entries: [] };
    }
    if (!isPlainPrototype(Object.getPrototypeOf(atomicSlots))) {
        return {
            problem: 'atomicSlots must be a plain object; inherited declarations are not allowed',
            entries: [],
        };
    }
    return {
        entries: Object.keys(atomicSlots).map((slotId) =>
            inspectAtomicSlot(slotId, atomicSlots[slotId]),
        ),
    };
};

const isUsableAtomicSlot = (
    entry: AtomicSlotEntry,
): entry is AtomicSlotEntry & { readonly declaration: Readonly<Record<string, unknown>> } =>
    entry.problem === undefined && entry.declaration !== undefined;

/** Builds a frozen slot-id keyed map of the usable entries; keys are own data properties. */
const usableAtomicSlots = (entries: readonly AtomicSlotEntry[]): Readonly<Record<string, object>> =>
    Object.freeze(
        Object.fromEntries(
            entries
                .filter(isUsableAtomicSlot)
                .map(({ slotId, declaration }) => [slotId, Object.freeze(declaration)]),
        ),
    );

const frozenValidAtomicSlots = (atomicSlots: unknown): CratisAtomicSlotMap | undefined => {
    if (atomicSlots === undefined) return undefined;
    const inspection = inspectAtomicSlots(atomicSlots);
    const problem =
        inspection.problem ?? inspection.entries.find((entry) => entry.problem)?.problem;
    if (problem) invalidPresentationLibrary(problem);
    return usableAtomicSlots(inspection.entries) as CratisAtomicSlotMap;
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
    const atomicSlots = frozenValidAtomicSlots(library.atomicSlots);

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
        ...(atomicSlots === undefined ? {} : { atomicSlots }),
    });
};

const atomicSlotsInspectionOf = (library: { readonly profile: string }) =>
    library.profile === CRATIS_PRESENTATION_PROFILE
        ? inspectAtomicSlots((library as { readonly atomicSlots?: unknown }).atomicSlots)
        : { entries: [] };

/** One reason a stable presentation library's atomic slot cannot be resolved. */
export interface StableAtomicSlotProblem {
    /** Offending slot id, when the problem concerns a single entry. */
    readonly slotId?: string;
    /** Human-readable reason. */
    readonly message: string;
}

/**
 * Lists why a stable presentation library's atomic slots cannot all be resolved. Libraries built
 * with the generic definer or as raw manifests can claim the stable profile without passing
 * {@link definePresentationUiLibrary}; resolution skips their invalid entries and this reports them.
 *
 * @param library Renderer library being validated.
 * @returns Problems in key order; empty for valid or absent atomic slots and for other profiles.
 * @internal Resolution helper; not part of the public package surface.
 */
export const stableAtomicSlotProblemsOf = (library: {
    readonly profile: string;
}): readonly StableAtomicSlotProblem[] => {
    const inspection: AtomicSlotInspection = atomicSlotsInspectionOf(library);
    if (inspection.problem) return [{ message: inspection.problem }];
    return inspection.entries.flatMap(({ slotId, problem }) =>
        problem ? [{ slotId, message: problem }] : [],
    );
};

/**
 * Returns the stable atomic slot declarations a stable presentation library adds to resolution.
 * Only own enumerable, fully valid declarations take part; invalid ones fail closed to the
 * built-in implementation and are reported by {@link stableAtomicSlotProblemsOf}. Libraries of any
 * other profile, and libraries without `atomicSlots`, contribute nothing, so their slot tables
 * resolve exactly as before.
 *
 * @param library Renderer library being resolved.
 * @returns The library's stable atomic declarations keyed by slot id; empty when it has none.
 * @internal Resolution helper; not part of the public package surface.
 */
export const stableAtomicSlotsOf = (library: {
    readonly profile: string;
}): unstable_SlotMap =>
    usableAtomicSlots(atomicSlotsInspectionOf(library).entries) as unstable_SlotMap;
