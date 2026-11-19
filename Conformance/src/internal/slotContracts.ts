// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SlotOwnership } from './SlotProfile.js';

/** Props type and ownership published for one stable atomic slot. */
export interface SlotContract {
    readonly propsType: string;
    readonly ownership: SlotOwnership;
}

/**
 * The contract text published on the generated atomic slot contracts page. It follows decisions 0007
 * and 0008 and the slot documentation in `presentation.ts`; the profile that carries it is what the
 * conformance runner exercises, so the page cannot describe a different slot than the one tested.
 */
export const slotContracts = {
    'datatables.paginator': {
        propsType: 'TablePaginatorProps',
        ownership: {
            core: [
                'The props contract: zero-based `page`, `pageCount`, zero-based `onPageChange` and the optional range and label props',
                'The paging state that supplies those props',
                'The built-in paginator, used whenever the slot is not declared',
            ],
            adapter: [
                'The navigation controls, their keyboard activation and their focus behavior',
                'Calling `onPageChange` with the zero-based target page, converting at the boundary when the design system counts from one',
            ],
        },
    },
    'common.tooltip': {
        propsType: 'TooltipProps',
        ownership: {
            core: [
                'The props contract: non-interactive `content`, `position`, `disabled`, `className` and exactly one focusable trigger child',
                'The overlay host and overlay container that the popup is bound to, read through `unstable_useOverlayHost()` and `unstable_useOverlayEnvironment()`',
            ],
            adapter: [
                'The trigger and popup parts, and describing the trigger with `aria-describedby` only',
                'Opening on hover and keyboard focus, and closing on blur and Escape',
                'Closing immediately when the overlay host closes, unmounts or changes',
            ],
        },
    },
    'dropdown.select': {
        propsType: 'DropdownProps<unknown>',
        ownership: {
            core: [
                'The props contract: `value`, `options`, `onChange` and the `multiple`, `filter` and `showClear` modes',
                'The overlay container the popover renders into',
            ],
            adapter: [
                'The trigger, filter input, listbox and options, with one keyboard and focus owner',
                'Opening, arrow-key and Enter selection, and Escape to close',
                'Calling `onChange` once per user selection with `source: \'user\'` and the native event',
            ],
        },
    },
    'display.datePicker': {
        propsType: 'DatePickerInputProps',
        ownership: {
            core: [
                'The props contract: a `Date` or `null` value, `minDate`, `maxDate`, `disabled`, `readOnly` and `invalid`',
                'The overlay container the popover renders into',
            ],
            adapter: [
                'The segmented input and the calendar popover, with one keyboard and focus owner',
                'Calling `onChange` once per user selection with `source: \'user\'` and the native event',
                'Keeping the value type of its calendar library inside the adapter',
            ],
        },
    },
    'dialogs.dialog': {
        propsType: 'CratisDialogSlotProps',
        ownership: {
            core: [
                'The dialog stack tier and z-index, and the `DialogResult` flow',
                'The typed footer and its buttons, the header actions, busy and validity state, and the announcement live region',
                'Initial focus, and the overlay environment that descendants portal into',
            ],
            adapter: [
                'The modal shell: focus trap, Escape, outside press, scroll lock and focus restoration',
                'The header, title, subtitle and close button, rendered from the props and the `host` prop',
            ],
        },
    },
    'common.numberInput': {
        propsType: 'NumericInputProps',
        ownership: {
            core: [
                'The props contract: a controlled numeric `value`, `invalid`, native input attributes and `onChange`',
                'Converting an `undefined` change into the command value',
            ],
            adapter: [
                'The native number input and its typing interaction',
                'Reporting the next number, or `undefined` when the input is empty or not a valid number',
            ],
        },
    },
} as const satisfies Readonly<Record<string, SlotContract>>;
