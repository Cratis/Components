// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { TablePaginatorProps } from '../../../DataTables/TablePaginator';
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    type CratisAtomicSlotMap,
    type CratisPresentationSlotMap,
    type CratisPresentationUiLibrary,
} from '../..';

const NoPresentation = () => null;

/** Nine presentation declarations that render nothing, so only the atomic slot is observable. */
export const silentPresentationSlots = (): CratisPresentationSlotMap =>
    Object.fromEntries(
        cratisPresentationSlotIds.map((slotId) => [
            slotId,
            { mode: 'presentation', fidelity: 'native', render: NoPresentation },
        ]),
    ) as unknown as CratisPresentationSlotMap;

/** Adapter-owned paginator that echoes the zero-based contract it received. */
export const AdapterPaginator: ComponentType<TablePaginatorProps> = ({
    page,
    pageCount,
}) => <nav data-adapter-paginator={`${page}/${pageCount}`} />;

/** Atomic map implementing the stable paginator with the adapter's component. */
export const paginatorAtomicSlots = (
    render: ComponentType<TablePaginatorProps> = AdapterPaginator,
): CratisAtomicSlotMap => ({
    'datatables.paginator': { mode: 'atomic', fidelity: 'native', render },
});

/** Builds a stable presentation library, optionally with atomic slots. */
export const aStablePresentationLibrary = (
    atomicSlots?: CratisAtomicSlotMap,
): CratisPresentationUiLibrary => ({
    id: 'sample',
    displayName: 'Sample',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities: ['slot.render', 'parts.passthrough', 'ssr.staticRender'],
    slots: silentPresentationSlots(),
    ...(atomicSlots ? { atomicSlots } : {}),
});
