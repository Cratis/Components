// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { Calendar } from 'primereact/calendar';
import React from 'react';

interface CalendarFieldComponentProps extends WrappedFieldProps<Date | null> {
    placeholder?: string;
    dateFormat?: string;
    showIcon?: boolean;
    showTime?: boolean;
    hourFormat?: '12' | '24';
    minDate?: Date;
    maxDate?: Date;
}

export const CalendarField = asCommandFormField<CalendarFieldComponentProps>(
    (props) => (
        <Calendar
            value={props.value}
            onChange={(e: { value: Date | null | undefined }) => props.onChange(e.value ?? null)}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            dateFormat={props.dateFormat}
            showIcon={props.showIcon}
            showTime={props.showTime}
            hourFormat={props.hourFormat}
            minDate={props.minDate}
            maxDate={props.maxDate}
            className="w-full"
        />
    ),
    {
        defaultValue: null,
        extractValue: (e: unknown) => e instanceof Date ? e : null
    }
);
