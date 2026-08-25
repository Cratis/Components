// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CratisComponentsConfig } from './CratisComponentsProvider';

/** Default locale and English Components messages. */
export const cratisDefaults: CratisComponentsConfig = {
    locale: 'en-US',
    messages: {
        paginator: {
            navigation: 'Pagination',
            first: 'First page',
            previous: 'Previous page',
            next: 'Next page',
            last: 'Last page',
        },
        datePicker: {
            today: 'Today',
            clear: 'Clear',
            openCalendar: 'Open calendar',
            previousMonth: 'Previous month',
            nextMonth: 'Next month',
            label: 'Date',
        },
        dropdown: {
            showOptions: 'Show options',
            clearSelection: 'Clear selection',
        },
        dialog: {
            ok: 'Ok',
            cancel: 'Cancel',
            yes: 'Yes',
            no: 'No',
            close: 'Close',
        },
        stepper: {
            next: 'Next',
            previous: 'Previous',
            submit: 'Submit',
        },
        notifications: {
            dismiss: 'Dismiss',
            region: 'Notifications',
        },
        dataTable: {
            selectRow: 'Select row',
            search: 'Search…',
            searchAriaLabel: 'Search table',
        },
        columnFilter: {
            matchModeAriaLabel: 'Match mode',
            clear: 'Clear',
            apply: 'Apply',
            true: 'True',
            false: 'False',
        },
    },
};
