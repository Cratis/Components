// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId } from 'react';
import type { DatePickerInputProps } from './DatePickerInput';

/** Resolves the calendar name and connects its trigger to the caller's or generated dialog ID. */
export const useDatePickerAccessibility = (props: DatePickerInputProps, openCalendarMessage: string | undefined) => {
    const generatedId = useId();
    const calendarId = props.pt?.dialog?.id ?? generatedId;
    const triggerLabel = props.openCalendarLabel ?? props.pt?.trigger?.['aria-label'] ?? openCalendarMessage ?? 'Open calendar';
    const triggerAttributes = (isOpen: boolean) => ({
        'aria-controls': isOpen ? calendarId : undefined,
    });

    return { calendarId, triggerLabel, triggerAttributes };
};
