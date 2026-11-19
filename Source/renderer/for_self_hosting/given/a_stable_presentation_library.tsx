// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { DatePickerInputProps } from '../../../Common/DatePickerInput';
import type { TooltipProps } from '../../../Common/Tooltip';
import type { CratisDialogSlotProps } from '../../../Dialogs/DialogHost';
import type { DropdownProps } from '../../../Dropdown/Dropdown';
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

/** Adapter-owned tooltip that echoes its content and renders the trigger unchanged. */
export const AdapterTooltip: ComponentType<TooltipProps> = ({ content, children }) => (
    <span data-adapter-tooltip={typeof content === 'string' ? content : ''}>{children}</span>
);

/** Atomic map implementing the stable tooltip with the adapter's component. */
export const tooltipAtomicSlots = (
    render: ComponentType<TooltipProps> = AdapterTooltip,
): CratisAtomicSlotMap => ({
    'common.tooltip': { mode: 'atomic', fidelity: 'native', render },
});

/** Adapter-owned select that echoes the value it received. */
export const AdapterDropdown: ComponentType<DropdownProps<unknown>> = ({ value }) => (
    <div data-adapter-dropdown={String(value)} />
);

/** Atomic map implementing the stable select with the adapter's component. */
export const dropdownAtomicSlots = (
    render: ComponentType<DropdownProps<unknown>> = AdapterDropdown,
): CratisAtomicSlotMap => ({
    'dropdown.select': { mode: 'atomic', fidelity: 'native', render },
});

/** Adapter-owned date picker that echoes the ISO date it received. */
export const AdapterDatePicker: ComponentType<DatePickerInputProps> = ({ value }) => (
    <div data-adapter-date-picker={value?.toISOString() ?? ''} />
);

/** Atomic map implementing the stable date picker with the adapter's component. */
export const datePickerAtomicSlots = (
    render: ComponentType<DatePickerInputProps> = AdapterDatePicker,
): CratisAtomicSlotMap => ({
    'display.datePicker': { mode: 'atomic', fidelity: 'native', render },
});

/** Adapter-owned dialog that renders the public title and the host-owned parts. */
export const AdapterDialog: ComponentType<CratisDialogSlotProps> = ({ title, host }) => (
    <section data-adapter-dialog={host.id} data-z-index={host.zIndex}>
        <h2 ref={host.titleRef}>{title}</h2>
        {host.headerActions}
        {host.content}
        {host.footer}
        {host.liveRegion}
        <div data-overlay-container ref={host.registerOverlayContainer} />
    </section>
);

/** Atomic map implementing the stable dialog with the adapter's component. */
export const dialogAtomicSlots = (
    render: ComponentType<CratisDialogSlotProps> = AdapterDialog,
): CratisAtomicSlotMap => ({
    'dialogs.dialog': { mode: 'atomic', fidelity: 'native', render },
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
