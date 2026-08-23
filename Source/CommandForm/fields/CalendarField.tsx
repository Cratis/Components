// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    DatePickerInput,
    type DatePickerInputPassThrough,
} from '../../Common/DatePickerInput';
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

    /** Cratis-owned per-part attributes applied to the date picker. */
    pt?: DatePickerInputPassThrough;

    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;

    /** Retained for source compatibility; consumers always own the CSS. */
    unstyled?: boolean;
}

/**
 * A date (or date-time) picker field bound to a `Date | null` property on a
 * Cratis Arc command. Set `showTime` to add a time selector alongside the
 * date. See {@link InputTextField} for the full `value={c => c.prop}`
 * binding model.
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
        <DatePickerInput
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            dateFormat={props.dateFormat}
            showIcon={props.showIcon}
            showTime={props.showTime}
            hourFormat={props.hourFormat}
            minDate={props.minDate}
            maxDate={props.maxDate}
            className={props.className}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: null,
        extractValue: (e: unknown) => (e instanceof Date ? e : null),
    },
);
