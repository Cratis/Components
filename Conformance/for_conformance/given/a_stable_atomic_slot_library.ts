// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisAtomicSlotId,
    type CratisAtomicSlots,
    type CratisPresentationSlotMap,
    type CratisPresentationUiLibrary,
} from '@cratis/components/renderer';
import { unstable_cratisBuiltIn } from '@cratis/components/renderer/builtin';
import { runConformance } from '../../src/index.js';

// SAFETY: the built-in manifest declares every stable presentation slot with its exact contract.
const builtInPresentationSlots = Object.fromEntries(
    cratisPresentationSlotIds.map((slotId) => [slotId, unstable_cratisBuiltIn.slots[slotId]]),
) as unknown as CratisPresentationSlotMap;

/** The built-in Components implementation of one atomic slot, typed with its stable contract. */
export const builtInAtomicSlot = <SlotId extends CratisAtomicSlotId>(slotId: SlotId) =>
    // SAFETY: the built-in declaration implements the exact stable contract of the slot.
    unstable_cratisBuiltIn.slots[slotId]!.render as unknown as ComponentType<
        CratisAtomicSlots[SlotId]
    >;

/** Stable presentation library that implements exactly one atomic slot with `render`. */
export const libraryWithAtomicSlot = <SlotId extends CratisAtomicSlotId>(
    slotId: SlotId,
    render: ComponentType<CratisAtomicSlots[SlotId]>,
): CratisPresentationUiLibrary =>
    definePresentationUiLibrary({
        id: 'stable-atomic-fixture',
        displayName: 'Stable atomic fixture',
        abi: CRATIS_PRESENTATION_ABI_VERSION,
        level: 'primitive',
        profile: CRATIS_PRESENTATION_PROFILE,
        profileSlots: cratisPresentationSlotIds,
        capabilities: ['slot.render', 'parts.passthrough', 'ssr.staticRender'],
        slots: builtInPresentationSlots,
        atomicSlots: { [slotId]: { mode: 'atomic', fidelity: 'native', render } },
    });

const metadataFor = (library: CratisPresentationUiLibrary, slotId: CratisAtomicSlotId) =>
    ({
        kind: 'ui-adapter',
        id: library.id,
        displayName: library.displayName,
        abi: `^${library.abi}`,
        level: library.level,
        profile: library.profile,
        category: 'test-fixture',
        entry: './dist/index.js',
        export: 'TestFixture',
        slots: [...cratisPresentationSlotIds, slotId],
        modes: {
            ...Object.fromEntries(
                cratisPresentationSlotIds.map((id) => [id, 'presentation']),
            ),
            [slotId]: 'atomic',
        },
        capabilities: [...library.capabilities],
        ssr: 'safe',
        a11y: { axeProfile: 'wcag21aa', evidence: './CONFORMANCE.md' },
        license: { spdx: 'MIT', requiresKey: false },
        upstream: { react: '^19.0.0' },
    }) as const;

/** Runs conformance, without axe, against a library that declares `slotId` as an atomic slot. */
export const runAtomicSlotConformance = (
    library: CratisPresentationUiLibrary,
    slotId: CratisAtomicSlotId,
) => runConformance(library, { metadata: metadataFor(library, slotId), document, axe: false });

/** Ids of the failed checks in a conformance report. */
export const failedCheckIds = (
    report: Awaited<ReturnType<typeof runAtomicSlotConformance>>,
) => report.checks.filter((check) => check.status === 'failed').map((check) => check.id);
