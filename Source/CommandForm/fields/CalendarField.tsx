// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { DatePicker } from 'primereact/datepicker';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import type { DatePickerRootProps, DatePickerRootValueChangeEvent } from '@primereact/types/primitive/datepicker';
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

    /** PrimeReact pass-through configuration applied to the underlying DatePicker. */
    pt?: DatePickerRootProps['pt'];

    /** PrimeReact pass-through options applied to the underlying DatePicker. */
    ptOptions?: DatePickerRootProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying DatePicker. */
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
        // PrimeReact 11's DatePicker is compositional: Root owns the date model, Input is
        // the text field, and the popup Calendar/Table auto-render the grid. `onBlur` rides
        // the wrapping div because React blur bubbles (focusout).
        <div className={props.className ? `w-full ${props.className}` : 'w-full'} onBlur={props.onBlur}>
            <DatePicker.Root
                value={props.value}
                onValueChange={(e: DatePickerRootValueChangeEvent) => props.onChange(e.value instanceof Date ? e.value : null)}
                invalid={props.invalid}
                dateFormat={props.dateFormat}
                showTime={props.showTime}
                hourFormat={props.hourFormat}
                minDate={props.minDate}
                maxDate={props.maxDate}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}>
                <DatePicker.Input as={InputText} placeholder={props.placeholder} className="w-full" />
                {props.showIcon && (
                    <DatePicker.Trigger>
                        <i className="pi pi-calendar" />
                    </DatePicker.Trigger>
                )}
                <DatePicker.Portal>
                    <DatePicker.Positioner align="start">
                        <DatePicker.Popup>
                            <DatePicker.Calendar>
                                <DatePicker.Header>
                                    <DatePicker.Prev as={Button} iconOnly variant="text" rounded severity="secondary" size="small">
                                        <i className="pi pi-chevron-left" />
                                    </DatePicker.Prev>
                                    <DatePicker.Title>
                                        <DatePicker.SelectMonth />
                                        <DatePicker.SelectYear />
                                        <DatePicker.Decade />
                                    </DatePicker.Title>
                                    <DatePicker.Next as={Button} iconOnly variant="text" rounded severity="secondary" size="small">
                                        <i className="pi pi-chevron-right" />
                                    </DatePicker.Next>
                                </DatePicker.Header>
                                <DatePicker.Table>
                                    <DatePicker.TableHead />
                                    <DatePicker.TableBody />
                                    <DatePicker.TableBody view="month" />
                                    <DatePicker.TableBody view="year" />
                                </DatePicker.Table>
                            </DatePicker.Calendar>
                            {props.showTime && <DatePicker.Time />}
                        </DatePicker.Popup>
                    </DatePicker.Positioner>
                </DatePicker.Portal>
            </DatePicker.Root>
        </div>
    ),
    {
        defaultValue: null,
        extractValue: (e: unknown) => e instanceof Date ? e : null
    }
);
