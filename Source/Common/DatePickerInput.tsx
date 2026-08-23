// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    ButtonHTMLAttributes,
    CSSProperties,
    FocusEventHandler,
} from 'react';
import {
    Button,
    Calendar,
    CalendarCell,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHeader,
    CalendarHeaderCell,
    DateInput,
    DatePicker as AriaDatePicker,
    DateSegment,
    Group,
    Popover,
    type DateValue,
} from 'react-aria-components/DatePicker';
import { Dialog } from 'react-aria-components/Dialog';
import { Heading } from 'react-aria-components/Heading';
import {
    fromDate,
    getLocalTimeZone,
    today,
    toCalendarDate,
} from '@internationalized/date';

interface DatePickerPartAttributes {
    id?: string;
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    [attribute: `data-${string}`]: string | number | boolean | undefined;
}

type DatePickerButtonAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'value'
>;

/** Stable Cratis-owned parts for styling a {@link DatePickerInput}. */
export interface DatePickerInputPassThrough {
    root?: DatePickerPartAttributes;
    group?: DatePickerPartAttributes;
    input?: DatePickerPartAttributes;
    segment?: DatePickerPartAttributes;
    trigger?: DatePickerButtonAttributes;
    popover?: DatePickerPartAttributes;
    dialog?: DatePickerPartAttributes;
    calendar?: DatePickerPartAttributes;
    header?: DatePickerPartAttributes;
    heading?: DatePickerPartAttributes;
    previous?: DatePickerButtonAttributes;
    next?: DatePickerButtonAttributes;
    grid?: DatePickerPartAttributes;
    cell?: DatePickerPartAttributes;
    buttonBar?: DatePickerPartAttributes;
    today?: DatePickerButtonAttributes;
    clear?: DatePickerButtonAttributes;
}

/** Props for {@link DatePickerInput}. */
export interface DatePickerInputProps {
    value: Date | null;
    onChange: (value: Date | null) => void;
    onBlur?: FocusEventHandler<HTMLElement>;
    invalid?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    id?: string;
    showButtonBar?: boolean;
    placeholder?: string;
    /** Deprecated mask from the PrimeReact implementation; locale controls formatting now. */
    dateFormat?: string;
    showIcon?: boolean;
    showTime?: boolean;
    hourFormat?: '12' | '24';
    minDate?: Date;
    maxDate?: Date;
    className?: string;
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: DatePickerInputPassThrough;
    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;
    /** Retained for source compatibility; consumers always own the CSS. */
    unstyled?: boolean;
    /** Localized label for the Today action. */
    todayLabel?: string;
    /** Localized label for the Clear action. */
    clearLabel?: string;
    /** Accessible name when no external label is supplied. */
    'aria-label'?: string;
    /** Id of the element that labels the picker. */
    'aria-labelledby'?: string;
    /** Id of the element that describes the picker. */
    'aria-describedby'?: string;
}

const classNames = (...values: Array<string | undefined>) => values.filter(Boolean).join(' ');

const asDateValue = (value: Date | null, showTime: boolean | undefined): DateValue | null => {
    if (!value) return null;
    const zoned = fromDate(value, getLocalTimeZone());
    return showTime ? zoned : toCalendarDate(zoned);
};

const asDate = (value: DateValue | null): Date | null =>
    value ? value.toDate(getLocalTimeZone()) : null;

/**
 * An internationalized date or date-time picker with Cratis-owned markup parts.
 * The public boundary remains `Date | null`; React Aria's calendar values stay internal.
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
    showIcon = false,
    showTime,
    hourFormat,
    minDate,
    maxDate,
    className,
    style,
    pt,
    todayLabel = 'Today',
    clearLabel = 'Clear',
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
}: DatePickerInputProps) => {
    const rootClassName = classNames('cratis-date-picker', pt?.root?.className, className);
    const inputId = id ?? pt?.input?.id;
    const effectiveDisabled = disabled ?? pt?.input?.disabled ?? false;
    const effectiveReadOnly = readOnly ?? pt?.input?.readOnly ?? false;
    const effectiveInvalid = invalid ?? pt?.input?.['aria-invalid'] ?? false;
    const effectivePlaceholder = placeholder ?? pt?.input?.placeholder;
    const effectiveAriaLabel = ariaLabel ?? pt?.input?.['aria-label'] ?? effectivePlaceholder ?? 'Date';
    const effectiveAriaLabelledby = ariaLabelledby ?? pt?.input?.['aria-labelledby'];
    const effectiveAriaDescribedby = ariaDescribedby ?? pt?.input?.['aria-describedby'];

    return (
        <div
            {...pt?.root}
            className={rootClassName}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
            data-invalid={effectiveInvalid || undefined}
            data-disabled={effectiveDisabled || undefined}
            data-readonly={effectiveReadOnly || undefined}
            onBlur={onBlur}
        >
            <AriaDatePicker
                value={asDateValue(value, showTime)}
                onChange={next => onChange(asDate(next))}
                isDisabled={effectiveDisabled}
                isReadOnly={effectiveReadOnly}
                isInvalid={effectiveInvalid}
                minValue={asDateValue(minDate ?? null, showTime) ?? undefined}
                maxValue={asDateValue(maxDate ?? null, showTime) ?? undefined}
                granularity={showTime ? 'minute' : 'day'}
                hourCycle={hourFormat === '12' ? 12 : hourFormat === '24' ? 24 : undefined}
                aria-label={effectiveAriaLabel}
                aria-labelledby={effectiveAriaLabelledby}
                aria-describedby={effectiveAriaDescribedby}
                className='cratis-date-picker__picker'
            >
                <Group
                    {...pt?.group}
                    id={inputId}
                    aria-invalid={effectiveInvalid || undefined}
                    className={classNames('cratis-date-picker__group', pt?.group?.className)}
                    data-cratis-part='group'
                >
                    <DateInput
                        className={classNames('cratis-date-picker__input', pt?.input?.className)}
                        style={pt?.input?.style}
                        data-cratis-part='input'
                        data-placeholder={effectivePlaceholder}
                    >
                        {segment => (
                            <DateSegment
                                {...pt?.segment}
                                segment={segment}
                                className={classNames('cratis-date-picker__segment', pt?.segment?.className)}
                                data-cratis-part='segment'
                            />
                        )}
                    </DateInput>
                    {showIcon && (
                        <Button
                            {...pt?.trigger}
                            isDisabled={effectiveDisabled || effectiveReadOnly}
                            className={classNames('cratis-date-picker__trigger', pt?.trigger?.className)}
                            data-cratis-part='trigger'
                            aria-label={pt?.trigger?.['aria-label'] ?? 'Open calendar'}
                        >
                            <span aria-hidden='true'>▦</span>
                        </Button>
                    )}
                </Group>
                <Popover
                    {...pt?.popover}
                    className={classNames('cratis-date-picker__popover', pt?.popover?.className)}
                    data-cratis-part='popover'
                    placement='bottom start'
                >
                    <Dialog
                        {...pt?.dialog}
                        className={classNames('cratis-date-picker__dialog', pt?.dialog?.className)}
                        data-cratis-part='dialog'
                    >
                        <Calendar
                            {...pt?.calendar}
                            className={classNames('cratis-date-picker__calendar', pt?.calendar?.className)}
                            data-cratis-part='calendar'
                        >
                            <header
                                {...pt?.header}
                                className={classNames('cratis-date-picker__header', pt?.header?.className)}
                                data-cratis-part='header'
                            >
                                <Button
                                    {...pt?.previous}
                                    slot='previous'
                                    className={classNames('cratis-date-picker__nav', pt?.previous?.className)}
                                    data-cratis-part='previous'
                                    aria-label={pt?.previous?.['aria-label'] ?? 'Previous month'}
                                >
                                    <span aria-hidden='true'>‹</span>
                                </Button>
                                <Heading
                                    {...pt?.heading}
                                    className={classNames('cratis-date-picker__heading', pt?.heading?.className)}
                                    data-cratis-part='heading'
                                />
                                <Button
                                    {...pt?.next}
                                    slot='next'
                                    className={classNames('cratis-date-picker__nav', pt?.next?.className)}
                                    data-cratis-part='next'
                                    aria-label={pt?.next?.['aria-label'] ?? 'Next month'}
                                >
                                    <span aria-hidden='true'>›</span>
                                </Button>
                            </header>
                            <CalendarGrid
                                className={classNames('cratis-date-picker__grid', pt?.grid?.className)}
                                data-cratis-part='grid'
                            >
                                <CalendarGridHeader>
                                    {day => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                                </CalendarGridHeader>
                                <CalendarGridBody>
                                    {date => (
                                        <CalendarCell
                                            {...pt?.cell}
                                            date={date}
                                            className={classNames('cratis-date-picker__cell', pt?.cell?.className)}
                                            data-cratis-part='cell'
                                        />
                                    )}
                                </CalendarGridBody>
                            </CalendarGrid>
                        </Calendar>
                        {showButtonBar && (
                            <div
                                {...pt?.buttonBar}
                                className={classNames('cratis-date-picker__button-bar', pt?.buttonBar?.className)}
                                data-cratis-part='button-bar'
                            >
                                <button
                                    {...pt?.today}
                                    type='button'
                                    className={classNames('cratis-date-picker__action', pt?.today?.className)}
                                    data-cratis-part='today'
                                    onClick={() => onChange(today(getLocalTimeZone()).toDate(getLocalTimeZone()))}
                                >
                                    {todayLabel}
                                </button>
                                <button
                                    {...pt?.clear}
                                    type='button'
                                    className={classNames('cratis-date-picker__action', pt?.clear?.className)}
                                    data-cratis-part='clear'
                                    onClick={() => onChange(null)}
                                >
                                    {clearLabel}
                                </button>
                            </div>
                        )}
                    </Dialog>
                </Popover>
            </AriaDatePicker>
        </div>
    );
};
