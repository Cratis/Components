// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Popover } from 'react-aria-components/DatePicker';
import { Dialog } from 'react-aria-components/Dialog';
import { classNames } from '../ClassNames/classNames';
import { DatePickerButtonBar, type DatePickerButtonBarProps } from './DatePickerButtonBar';
import { DatePickerCalendar } from './DatePickerCalendar';
import type { DatePickerInputPassThrough } from './DatePickerInput';

interface DatePickerPopoverProps {
    pt: DatePickerInputPassThrough | undefined;
    isNonModal: boolean;
    zIndex: string;
    buttonBar: DatePickerButtonBarProps | null;
}

/** The portaled popover with the calendar dialog and, when requested, the Today and Clear actions. */
export const DatePickerPopover = ({ pt, isNonModal, zIndex, buttonBar }: DatePickerPopoverProps) => (
    <Popover
        {...pt?.popover}
        isNonModal={isNonModal}
        className={classNames('cratis-date-picker__popover', pt?.popover?.className)}
        style={{ zIndex, ...pt?.popover?.style }}
        data-cratis-part='popover'
        data-open
        placement='bottom start'
    >
        <Dialog
            {...pt?.dialog}
            className={classNames('cratis-date-picker__dialog', pt?.dialog?.className)}
            data-cratis-part='dialog'
            data-open
        >
            <DatePickerCalendar pt={pt} />
            {buttonBar && <DatePickerButtonBar {...buttonBar} />}
        </Dialog>
    </Popover>
);
