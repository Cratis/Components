// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    CRATIS_PRESENTATION_PROFILE,
    cratisAtomicSlotIds,
    type unstable_SlotId,
    type unstable_UiLibrary,
} from '@cratis/components/renderer';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Returns the stable atomic slots a stable presentation library declares, in canonical order.
 * Every other library declares none, so its exercised slots stay exactly as before.
 */
const declaredAtomicSlots = (
    library: unstable_UiLibrary,
): readonly (readonly [unstable_SlotId, unknown])[] => {
    if (library.profile !== CRATIS_PRESENTATION_PROFILE) return [];
    const { atomicSlots } = library as { readonly atomicSlots?: unknown };
    if (!isRecord(atomicSlots)) return [];
    return cratisAtomicSlotIds
        .map((slotId) => [slotId, atomicSlots[slotId]] as const)
        .filter(([, declaration]) => declaration !== undefined);
};

/** Library view and slot ids the runner exercises, including optional stable atomic slots. */
export interface ExercisedLibrary {
    readonly library: unstable_UiLibrary;
    readonly slotIds: readonly string[];
}

/**
 * Builds the library view the metadata, slot, SSR, hydration and environment checks exercise:
 * the stable atomic slots join the profile slots and the slot map, so package metadata lists them
 * alongside the nine. A library without stable atomic slots is returned unchanged.
 *
 * @param library Renderer library under test.
 * @returns The exercised library and the slot ids whose profiles run.
 */
export const exercisedLibrary = (library: unstable_UiLibrary): ExercisedLibrary => {
    const profileSlots: readonly unstable_SlotId[] =
        library.profileSlots ?? (Object.keys(library.slots) as unstable_SlotId[]);
    const atomic = declaredAtomicSlots(library);
    if (atomic.length === 0) return { library, slotIds: profileSlots };

    const slotIds = [...profileSlots, ...atomic.map(([slotId]) => slotId)];
    return {
        library: {
            ...library,
            profileSlots: slotIds,
            slots: { ...library.slots, ...Object.fromEntries(atomic) },
        },
        slotIds,
    };
};
