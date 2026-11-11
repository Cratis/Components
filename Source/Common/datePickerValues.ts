// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    fromDate,
    getLocalTimeZone,
    today,
    toCalendarDate,
    type DateValue,
} from '@internationalized/date';

export const asDateValue = (
    value: Date | null,
    showTime: boolean | undefined,
): DateValue | null => {
    if (!value) return null;
    const zoned = fromDate(value, getLocalTimeZone());
    return showTime ? zoned : toCalendarDate(zoned);
};

export const asDate = (value: DateValue | null): Date | null =>
    value ? value.toDate(getLocalTimeZone()) : null;

const isBelow = (value: DateValue, minimum: DateValue | undefined): boolean =>
    minimum !== undefined && value.compare(minimum) < 0;

const isAbove = (value: DateValue, maximum: DateValue | undefined): boolean =>
    maximum !== undefined && value.compare(maximum) > 0;

/** The calendar bounds for the configured dates, and whether the Today action falls outside them. */
export const resolveDatePickerBounds = (
    minDate: Date | null | undefined,
    maxDate: Date | null | undefined,
    showTime: boolean | undefined,
) => {
    const timeZone = getLocalTimeZone();
    const minValue = asDateValue(minDate ?? null, showTime) ?? undefined;
    const maxValue = asDateValue(maxDate ?? null, showTime) ?? undefined;
    const todayDate = today(timeZone).toDate(timeZone);
    // Compare the same granularity that the action emits. In date-time mode the Today action
    // retains its existing local-midnight value, which can legitimately fall before a same-day
    // minDate carrying a later time.
    const todayValue = asDateValue(todayDate, showTime)!;
    const isTodayOutOfBounds = isBelow(todayValue, minValue) || isAbove(todayValue, maxValue);
    return { minValue, maxValue, todayDate, isTodayOutOfBounds };
};
