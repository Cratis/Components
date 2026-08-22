// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    CSSProperties,
    FocusEventHandler,
    InputHTMLAttributes,
    KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { DatePicker, useDatePickerContext } from 'primereact/datepicker';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import type {
    DatePickerRootPassThrough,
    DatePickerRootPassThroughType,
    DatePickerRootProps,
    DatePickerRootValueChangeEvent,
} from '@primereact/types/primitive/datepicker';

/**
 * Pass-through configuration for {@link DatePickerInput}.
 *
 * PrimeReact 11 routes the rendered input through `input`; its published
 * `pcInputText` declaration is not used by the runtime composition.
 */
export type DatePickerInputPassThrough = Omit<
    DatePickerRootPassThrough,
    'pcInputText'
> & {
    /** Attributes applied to the rendered input element. */
    input?: DatePickerRootPassThroughType<InputHTMLAttributes<HTMLInputElement>>;
};

const stopDatePickerKeyboardOpening = (event: ReactKeyboardEvent) => {
    if (event.code === 'ArrowDown') {
        event.stopPropagation();
    }
};

const DatePickerInputButtonBar = () => {
    const datePicker = useDatePickerContext();

    return (
        <DatePicker.Buttonbar>
            <DatePicker.Today>{datePicker?.todayLabel}</DatePicker.Today>
            <DatePicker.Clear>{datePicker?.clearLabel}</DatePicker.Clear>
        </DatePicker.Buttonbar>
    );
};

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
    /** Disables the date model, input and trigger. */
    disabled?: boolean;
    /** Prevents manual input and date selection. */
    readOnly?: boolean;
    /** DOM id applied to the rendered input element. */
    id?: string;
    /** When true, shows the localized Today and Clear button bar in the popup. */
    showButtonBar?: boolean;
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
    pt?: DatePickerInputPassThrough;
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
    disabled,
    readOnly,
    id,
    showButtonBar,
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
    <div
        className={className ? `w-full ${className}` : 'w-full'}
        style={style}
        onBlur={onBlur}
    >
        <DatePicker.Root
            value={value}
            onValueChange={(e: DatePickerRootValueChangeEvent) =>
                onChange(e.value instanceof Date ? e.value : null)
            }
            disabled={disabled}
            readOnly={readOnly}
            showOnFocus={!disabled && !readOnly}
            dateFormat={dateFormat}
            showTime={showTime}
            hourFormat={hourFormat}
            minDate={minDate}
            maxDate={maxDate}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}
        >
            <DatePicker.Input
                as={InputText}
                {...(id === undefined ? {} : { id })}
                {...(disabled === undefined ? {} : { disabled })}
                {...(readOnly === undefined ? {} : { readOnly })}
                {...(disabled || readOnly
                    ? { onKeyDownCapture: stopDatePickerKeyboardOpening }
                    : {})}
                {...(placeholder === undefined ? {} : { placeholder })}
                {...(invalid === undefined
                    ? {}
                    : {
                          'aria-invalid': invalid || undefined,
                          'data-invalid': invalid ? '' : undefined,
                      })}
                className='w-full'
            />
            {showIcon && (
                <DatePicker.Trigger disabled={disabled || readOnly}>
                    <i className='pi pi-calendar' />
                </DatePicker.Trigger>
            )}
            <DatePicker.Portal>
                <DatePicker.Positioner align='start'>
                    <DatePicker.Popup>
                        <DatePicker.Calendar>
                            <DatePicker.Header>
                                <DatePicker.Prev
                                    as={Button}
                                    iconOnly
                                    variant='text'
                                    rounded
                                    severity='secondary'
                                    size='small'
                                >
                                    <i className='pi pi-chevron-left' />
                                </DatePicker.Prev>
                                <DatePicker.Title>
                                    <DatePicker.SelectMonth />
                                    <DatePicker.SelectYear />
                                    <DatePicker.Decade />
                                </DatePicker.Title>
                                <DatePicker.Next
                                    as={Button}
                                    iconOnly
                                    variant='text'
                                    rounded
                                    severity='secondary'
                                    size='small'
                                >
                                    <i className='pi pi-chevron-right' />
                                </DatePicker.Next>
                            </DatePicker.Header>
                            <DatePicker.Table>
                                <DatePicker.TableHead />
                                <DatePicker.TableBody />
                                <DatePicker.TableBody view='month' />
                                <DatePicker.TableBody view='year' />
                            </DatePicker.Table>
                        </DatePicker.Calendar>
                        {showTime && <DatePicker.Time />}
                        {showButtonBar && <DatePickerInputButtonBar />}
                    </DatePicker.Popup>
                </DatePicker.Positioner>
            </DatePicker.Portal>
        </DatePicker.Root>
    </div>
);
