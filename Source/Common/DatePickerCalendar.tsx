// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Button,
    Calendar,
    CalendarCell,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHeader,
    CalendarHeaderCell,
} from 'react-aria-components/DatePicker';
import { Heading } from 'react-aria-components/Heading';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { classNames } from '../ClassNames/classNames';
import { useCratisComponentsConfig } from './CratisComponentsProvider';
import { asReactAriaButtonProps } from './reactAriaProps';
import type { DatePickerInputPassThrough } from './DatePickerInput';

interface DatePickerCalendarProps {
    pt: DatePickerInputPassThrough | undefined;
}

interface NavigationButtonProps extends DatePickerCalendarProps {
    slot: 'previous' | 'next';
    message: string | undefined;
    fallbackLabel: string;
    fallbackGlyph: string;
}

const NavigationButton = ({ pt, slot, message, fallbackLabel, fallbackGlyph }: NavigationButtonProps) => {
    const icon = useCratisIcon();
    const part = pt?.[slot];
    return (
        <Button
            {...asReactAriaButtonProps(part)}
            slot={slot}
            className={classNames('cratis-date-picker__nav', part?.className)}
            data-cratis-part={slot}
            aria-label={part?.['aria-label'] ?? message ?? fallbackLabel}
        >
            <span aria-hidden='true'>{icon(slot, fallbackGlyph)}</span>
        </Button>
    );
};

const CalendarHeader = ({ pt }: DatePickerCalendarProps) => {
    const datePickerMessages = useCratisComponentsConfig().messages?.datePicker;
    return (
        <header
            {...pt?.header}
            className={classNames('cratis-date-picker__header', pt?.header?.className)}
            data-cratis-part='header'
        >
            <NavigationButton
                pt={pt}
                slot='previous'
                message={datePickerMessages?.previousMonth}
                fallbackLabel='Previous month'
                fallbackGlyph='‹'
            />
            <Heading
                {...pt?.heading}
                className={classNames('cratis-date-picker__heading', pt?.heading?.className)}
                data-cratis-part='heading'
            />
            <NavigationButton
                pt={pt}
                slot='next'
                message={datePickerMessages?.nextMonth}
                fallbackLabel='Next month'
                fallbackGlyph='›'
            />
        </header>
    );
};

const CalendarMonthGrid = ({ pt }: DatePickerCalendarProps) => (
    <CalendarGrid
        {...pt?.grid}
        className={classNames('cratis-date-picker__grid', pt?.grid?.className)}
        data-cratis-part='grid'
    >
        <CalendarGridHeader>
            {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
        </CalendarGridHeader>
        <CalendarGridBody>
            {(date) => (
                <CalendarCell
                    {...pt?.cell}
                    date={date}
                    className={classNames('cratis-date-picker__cell', pt?.cell?.className)}
                    data-cratis-part='cell'
                />
            )}
        </CalendarGridBody>
    </CalendarGrid>
);

/** The calendar of the date picker popover: month navigation header and day grid. */
export const DatePickerCalendar = ({ pt }: DatePickerCalendarProps) => (
    <Calendar
        {...pt?.calendar}
        className={classNames('cratis-date-picker__calendar', pt?.calendar?.className)}
        data-cratis-part='calendar'
        data-open
    >
        <CalendarHeader pt={pt} />
        <CalendarMonthGrid pt={pt} />
    </Calendar>
);
