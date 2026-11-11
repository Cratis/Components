// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { DatePickerInputPassThrough } from './DatePickerInput';

export interface DatePickerButtonBarProps {
    pt: DatePickerInputPassThrough | undefined;
    todayLabel: string;
    clearLabel: string;
    actionsDisabled: boolean;
    clearDisabled: boolean;
    isTodayOutOfBounds: boolean;
    todayDate: Date;
    onChange: ChangeHandler<Date | null>;
}

type ActionProps = Pick<DatePickerButtonBarProps, 'pt' | 'onChange'>;

const TodayAction = ({
    pt,
    label,
    todayDate,
    disabled,
    onChange,
}: ActionProps & { label: string; todayDate: Date; disabled: boolean }) => (
    <button
        {...pt?.today}
        type='button'
        className={classNames('cratis-date-picker__action', pt?.today?.className)}
        data-cratis-part='today'
        data-disabled={disabled || undefined}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        onClick={(event) => {
            if (disabled) return;
            onChange(todayDate, { source: 'user', nativeEvent: event.nativeEvent });
        }}
    >
        {label}
    </button>
);

const ClearAction = ({
    pt,
    label,
    disabled,
    onChange,
}: ActionProps & { label: string; disabled: boolean }) => (
    <button
        {...pt?.clear}
        type='button'
        className={classNames('cratis-date-picker__action', pt?.clear?.className)}
        data-cratis-part='clear'
        data-disabled={disabled || undefined}
        disabled={disabled}
        aria-disabled={disabled || pt?.clear?.['aria-disabled'] || undefined}
        onClick={(event) => {
            if (disabled) return;
            onChange(null, { source: 'user', nativeEvent: event.nativeEvent });
        }}
    >
        {label}
    </button>
);

/** The Today and Clear actions below the calendar. */
export const DatePickerButtonBar = ({
    pt,
    todayLabel,
    clearLabel,
    actionsDisabled,
    clearDisabled,
    isTodayOutOfBounds,
    todayDate,
    onChange,
}: DatePickerButtonBarProps) => (
    <div
        {...pt?.buttonBar}
        className={classNames('cratis-date-picker__button-bar', pt?.buttonBar?.className)}
        data-cratis-part='button-bar'
    >
        <TodayAction
            pt={pt}
            label={todayLabel}
            todayDate={todayDate}
            disabled={actionsDisabled || isTodayOutOfBounds}
            onChange={onChange}
        />
        <ClearAction pt={pt} label={clearLabel} disabled={clearDisabled} onChange={onChange} />
    </div>
);
