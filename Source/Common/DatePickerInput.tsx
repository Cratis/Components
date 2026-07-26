// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type CSSProperties, type FocusEventHandler } from 'react';
import { DatePicker } from 'primereact/datepicker';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import type { DatePickerRootProps, DatePickerRootValueChangeEvent } from '@primereact/types/primitive/datepicker';

/** Props for {@link DatePickerInput}. */
export interface DatePickerInputProps {
    /** The selected date, or `null` when nothing is selected. */
    value: Date | null;
    /** Invoked with the newly-selected date (or `null`). */
    onChange: (value: Date | null) => void;
    /** Invoked when focus leaves the control. */
    onBlur?: FocusEventHandler<HTMLElement>;
    /** Renders the control in an invalid (error) state. */
    invalid?: boolean;
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
    /** Inline style for the wrapping element. */
    style?: CSSProperties;
    /** PrimeReact pass-through configuration applied to the underlying DatePicker. */
    pt?: DatePickerRootProps['pt'];
    /** PrimeReact pass-through options applied to the underlying DatePicker. */
    ptOptions?: DatePickerRootProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the underlying DatePicker. */
    unstyled?: boolean;
}

/**
 * A wrapper-owned date (or date-time) picker with a simple `value` / `onChange`
 * (`Date | null`) surface, assembling PrimeReact 11's compositional
 * `DatePicker` (Root owns the date model, Input is the text field, and the
 * popup Calendar/Table auto-render the grid). Shared by {@link CalendarField}
 * (the command-bound field) and other editors that need a raw date input.
 *
 * `onBlur` rides the wrapping `<div>` because React blur bubbles (focusout).
 */
export const DatePickerInput = ({
    value,
    onChange,
    onBlur,
    invalid,
    placeholder,
    dateFormat,
    showIcon,
    showTime,
    hourFormat,
    minDate,
    maxDate,
    className,
    style,
    pt,
    ptOptions,
    unstyled,
}: DatePickerInputProps) => (
    <div className={className ? `w-full ${className}` : 'w-full'} style={style} onBlur={onBlur}>
        <DatePicker.Root
            value={value}
            onValueChange={(e: DatePickerRootValueChangeEvent) => onChange(e.value instanceof Date ? e.value : null)}
            invalid={invalid}
            dateFormat={dateFormat}
            showTime={showTime}
            hourFormat={hourFormat}
            minDate={minDate}
            maxDate={maxDate}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}>
            <DatePicker.Input as={InputText} placeholder={placeholder} className="w-full" />
            {showIcon && (
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
                        {showTime && <DatePicker.Time />}
                    </DatePicker.Popup>
                </DatePicker.Positioner>
            </DatePicker.Portal>
        </DatePicker.Root>
    </div>
);
