// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { Calendar, type CalendarProps } from 'primereact/calendar';
import React from 'react';

/**
 * Component-level props for {@link CalendarField}.
 */
interface CalendarFieldComponentProps extends WrappedFieldProps<Date | null> {
    /** Placeholder text shown when no date is selected. */
    placeholder?: string;

    /** PrimeReact-style date format mask (e.g. `'yy-mm-dd'`). */
    dateFormat?: string;

    /** When true, renders a trailing calendar icon button. */
    showIcon?: boolean;

    /** When true, includes time selection alongside the date. */
    showTime?: boolean;

    /** Hour format used when {@link showTime} is true. */
    hourFormat?: '12' | '24';

    /** Earliest selectable date. */
    minDate?: Date;

    /** Latest selectable date. */
    maxDate?: Date;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying Calendar. */
    pt?: CalendarProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Calendar. */
    ptOptions?: CalendarProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Calendar. */
    unstyled?: boolean;
}

/**
 * A date (or date-time) picker field for use inside a `CommandForm`. Binds to
 * a `Date | null` property on the command.
 *
 * ```tsx
 * <CalendarField value={c => c.dueDate}
 *                title="Due date"
 *                showIcon
 *                minDate={new Date()} />
 * ```
 */
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
            className={props.className ? `w-full ${props.className}` : 'w-full'}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: null,
        extractValue: (e: unknown) => e instanceof Date ? e : null
    }
);
