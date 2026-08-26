// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    ButtonHTMLAttributes,
    CSSProperties,
    FocusEventHandler,
    HTMLAttributes,
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
import { useCratisComponentsConfig } from './CratisComponentsProvider';
import { asReactAriaButtonProps } from './reactAriaProps';
import {
    fromDate,
    getLocalTimeZone,
    today,
    toCalendarDate,
} from '@internationalized/date';

interface DatePickerPartAttributes extends Omit<
    HTMLAttributes<HTMLElement>,
    'defaultValue' | 'onChange' | 'role'
> {
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
    /** Outer wrapper. */
    root?: DatePickerPartAttributes;
    /** Focusable segmented-input group. */
    group?: DatePickerPartAttributes;
    /** Segmented date input. */
    input?: DatePickerPartAttributes;
    /** Visible empty-value placeholder. */
    placeholder?: DatePickerPartAttributes;
    /** Individual editable date/time segment. */
    segment?: DatePickerPartAttributes;
    /** Calendar popup trigger. */
    trigger?: DatePickerButtonAttributes;
    /** Portaled calendar popover. */
    popover?: DatePickerPartAttributes;
    /** Calendar dialog. */
    dialog?: DatePickerPartAttributes;
    /** Calendar root. */
    calendar?: DatePickerPartAttributes;
    /** Calendar navigation header. */
    header?: DatePickerPartAttributes;
    /** Current month/year heading. */
    heading?: DatePickerPartAttributes;
    /** Previous-month action. */
    previous?: DatePickerButtonAttributes;
    /** Next-month action. */
    next?: DatePickerButtonAttributes;
    /** Calendar grid. */
    grid?: DatePickerPartAttributes;
    /** One calendar cell. */
    cell?: DatePickerPartAttributes;
    /** Today/clear action row. */
    buttonBar?: DatePickerPartAttributes;
    /** Today action; disabled and non-interactive when today falls outside `minDate`/`maxDate`. */
    today?: DatePickerButtonAttributes;
    /** Clear action. */
    clear?: DatePickerButtonAttributes;
}

/** Props for {@link DatePickerInput}. */
export interface DatePickerInputProps {
    /** Controlled JavaScript date value. */
    value: Date | null;
    /** Invoked with the selected JavaScript date or `null`. */
    onChange: (value: Date | null) => void;
    /** Invoked when focus leaves the picker wrapper. */
    onBlur?: FocusEventHandler<HTMLElement>;
    /** Marks the picker invalid. */
    invalid?: boolean;
    /** Disables every picker control. */
    disabled?: boolean;
    /** Prevents editing while retaining focus semantics. */
    readOnly?: boolean;
    /** DOM id for the segmented-input group. */
    id?: string;
    /** Shows Today and Clear actions. */
    showButtonBar?: boolean;
    /** Visible text while no date is selected. */
    placeholder?: string;
    /** Deprecated renderer mask; locale controls formatting now. */
    dateFormat?: string;
    /** Shows the calendar trigger button. Defaults to `true`. */
    showIcon?: boolean;
    /** Adds hour/minute segments. */
    showTime?: boolean;
    /** Preferred 12- or 24-hour cycle. */
    hourFormat?: '12' | '24';
    /** Earliest selectable date. */
    minDate?: Date;
    /** Latest selectable date. */
    maxDate?: Date;
    /** Extra class name for the outer wrapper. */
    className?: string;
    /** Inline style for the outer wrapper. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: DatePickerInputPassThrough;
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
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

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

const asDateValue = (
    value: Date | null,
    showTime: boolean | undefined,
): DateValue | null => {
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
    showIcon = true,
    showTime,
    hourFormat,
    minDate,
    maxDate,
    className,
    style,
    pt,
    todayLabel,
    clearLabel,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
}: DatePickerInputProps) => {
    const { messages } = useCratisComponentsConfig();
    const datePickerMessages = messages?.datePicker;
    const resolvedTodayLabel = todayLabel ?? datePickerMessages?.today ?? 'Today';
    const resolvedClearLabel = clearLabel ?? datePickerMessages?.clear ?? 'Clear';
    const timeZone = getLocalTimeZone();
    const minValue = asDateValue(minDate ?? null, showTime) ?? undefined;
    const maxValue = asDateValue(maxDate ?? null, showTime) ?? undefined;
    const todayDate = today(timeZone).toDate(timeZone);
    // Compare the same granularity that the action emits. In date-time mode the Today action
    // retains its existing local-midnight value, which can legitimately fall before a same-day
    // minDate carrying a later time.
    const todayValue = asDateValue(todayDate, showTime)!;
    const isTodayOutOfBounds =
        (minValue !== undefined && todayValue.compare(minValue) < 0) ||
        (maxValue !== undefined && todayValue.compare(maxValue) > 0);
    const rootClassName = classNames(
        'cratis-date-picker',
        pt?.root?.className,
        className,
    );
    const inputId = id ?? pt?.input?.id;
    const effectiveDisabled = disabled ?? pt?.input?.disabled ?? false;
    const effectiveReadOnly = readOnly ?? pt?.input?.readOnly ?? false;
    const effectiveInvalid = invalid ?? pt?.input?.['aria-invalid'] ?? false;
    const effectivePlaceholder = placeholder ?? pt?.input?.placeholder;
    const effectiveAriaLabel =
        ariaLabel ??
        pt?.input?.['aria-label'] ??
        effectivePlaceholder ??
        datePickerMessages?.label ??
        'Date';
    const effectiveAriaLabelledby = ariaLabelledby ?? pt?.input?.['aria-labelledby'];
    const effectiveAriaDescribedby = ariaDescribedby ?? pt?.input?.['aria-describedby'];
    const inputPartAttributes = {
        ...pt?.input,
        id: undefined,
        className: undefined,
        style: undefined,
        disabled: undefined,
        readOnly: undefined,
        placeholder: undefined,
        'aria-label': undefined,
        'aria-labelledby': undefined,
        'aria-describedby': undefined,
        'aria-invalid': undefined,
    };

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
                onChange={(next) => onChange(asDate(next))}
                isDisabled={effectiveDisabled}
                isReadOnly={effectiveReadOnly}
                isInvalid={effectiveInvalid}
                minValue={minValue}
                maxValue={maxValue}
                granularity={showTime ? 'minute' : 'day'}
                hourCycle={
                    hourFormat === '12' ? 12 : hourFormat === '24' ? 24 : undefined
                }
                aria-label={effectiveAriaLabel}
                aria-labelledby={effectiveAriaLabelledby}
                aria-describedby={effectiveAriaDescribedby}
                className='cratis-date-picker__picker'
            >
                <Group
                    {...pt?.group}
                    id={inputId}
                    aria-invalid={effectiveInvalid || undefined}
                    className={classNames(
                        'cratis-date-picker__group',
                        pt?.group?.className,
                    )}
                    data-cratis-part='group'
                    data-empty={value === null || undefined}
                >
                    <DateInput
                        {...inputPartAttributes}
                        className={classNames(
                            'cratis-date-picker__input',
                            pt?.input?.className,
                        )}
                        style={pt?.input?.style}
                        data-cratis-part='input'
                        data-placeholder={effectivePlaceholder}
                    >
                        {(segment) => (
                            <DateSegment
                                {...pt?.segment}
                                segment={segment}
                                className={classNames(
                                    'cratis-date-picker__segment',
                                    pt?.segment?.className,
                                )}
                                data-cratis-part='segment'
                            />
                        )}
                    </DateInput>
                    {value === null && effectivePlaceholder && (
                        <span
                            {...pt?.placeholder}
                            className={classNames(
                                'cratis-date-picker__placeholder',
                                pt?.placeholder?.className,
                            )}
                            data-cratis-part='placeholder'
                            aria-hidden='true'
                        >
                            {effectivePlaceholder}
                        </span>
                    )}
                    {showIcon && (
                        <Button
                            {...asReactAriaButtonProps(pt?.trigger)}
                            isDisabled={effectiveDisabled || effectiveReadOnly}
                            className={classNames(
                                'cratis-date-picker__trigger',
                                pt?.trigger?.className,
                            )}
                            data-cratis-part='trigger'
                            aria-label={
                                pt?.trigger?.['aria-label'] ??
                                datePickerMessages?.openCalendar ??
                                'Open calendar'
                            }
                        >
                            <span aria-hidden='true'>▦</span>
                        </Button>
                    )}
                </Group>
                <Popover
                    {...pt?.popover}
                    className={classNames(
                        'cratis-date-picker__popover',
                        pt?.popover?.className,
                    )}
                    data-cratis-part='popover'
                    placement='bottom start'
                >
                    <Dialog
                        {...pt?.dialog}
                        className={classNames(
                            'cratis-date-picker__dialog',
                            pt?.dialog?.className,
                        )}
                        data-cratis-part='dialog'
                    >
                        <Calendar
                            {...pt?.calendar}
                            className={classNames(
                                'cratis-date-picker__calendar',
                                pt?.calendar?.className,
                            )}
                            data-cratis-part='calendar'
                        >
                            <header
                                {...pt?.header}
                                className={classNames(
                                    'cratis-date-picker__header',
                                    pt?.header?.className,
                                )}
                                data-cratis-part='header'
                            >
                                <Button
                                    {...asReactAriaButtonProps(pt?.previous)}
                                    slot='previous'
                                    className={classNames(
                                        'cratis-date-picker__nav',
                                        pt?.previous?.className,
                                    )}
                                    data-cratis-part='previous'
                                    aria-label={
                                        pt?.previous?.['aria-label'] ??
                                        datePickerMessages?.previousMonth ??
                                        'Previous month'
                                    }
                                >
                                    <span aria-hidden='true'>‹</span>
                                </Button>
                                <Heading
                                    {...pt?.heading}
                                    className={classNames(
                                        'cratis-date-picker__heading',
                                        pt?.heading?.className,
                                    )}
                                    data-cratis-part='heading'
                                />
                                <Button
                                    {...asReactAriaButtonProps(pt?.next)}
                                    slot='next'
                                    className={classNames(
                                        'cratis-date-picker__nav',
                                        pt?.next?.className,
                                    )}
                                    data-cratis-part='next'
                                    aria-label={
                                        pt?.next?.['aria-label'] ??
                                        datePickerMessages?.nextMonth ??
                                        'Next month'
                                    }
                                >
                                    <span aria-hidden='true'>›</span>
                                </Button>
                            </header>
                            <CalendarGrid
                                {...pt?.grid}
                                className={classNames(
                                    'cratis-date-picker__grid',
                                    pt?.grid?.className,
                                )}
                                data-cratis-part='grid'
                            >
                                <CalendarGridHeader>
                                    {(day) => (
                                        <CalendarHeaderCell>{day}</CalendarHeaderCell>
                                    )}
                                </CalendarGridHeader>
                                <CalendarGridBody>
                                    {(date) => (
                                        <CalendarCell
                                            {...pt?.cell}
                                            date={date}
                                            className={classNames(
                                                'cratis-date-picker__cell',
                                                pt?.cell?.className,
                                            )}
                                            data-cratis-part='cell'
                                        />
                                    )}
                                </CalendarGridBody>
                            </CalendarGrid>
                        </Calendar>
                        {showButtonBar && (
                            <div
                                {...pt?.buttonBar}
                                className={classNames(
                                    'cratis-date-picker__button-bar',
                                    pt?.buttonBar?.className,
                                )}
                                data-cratis-part='button-bar'
                            >
                                <button
                                    {...pt?.today}
                                    type='button'
                                    className={classNames(
                                        'cratis-date-picker__action',
                                        pt?.today?.className,
                                    )}
                                    data-cratis-part='today'
                                    disabled={isTodayOutOfBounds}
                                    aria-disabled={isTodayOutOfBounds || undefined}
                                    onClick={() => {
                                        if (isTodayOutOfBounds) return;
                                        onChange(todayDate);
                                    }}
                                >
                                    {resolvedTodayLabel}
                                </button>
                                <button
                                    {...pt?.clear}
                                    type='button'
                                    className={classNames(
                                        'cratis-date-picker__action',
                                        pt?.clear?.className,
                                    )}
                                    data-cratis-part='clear'
                                    onClick={() => onChange(null)}
                                >
                                    {resolvedClearLabel}
                                </button>
                            </div>
                        )}
                    </Dialog>
                </Popover>
            </AriaDatePicker>
        </div>
    );
};
