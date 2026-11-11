// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DateInput, DateSegment } from 'react-aria-components/DatePicker';
import { classNames } from '../ClassNames/classNames';
import type { DatePickerInputPassThrough } from './DatePickerInput';
import {
    fieldStateAttributes,
    segmentStateAttributes,
    type DatePickerFieldState,
} from './datePickerStateAttributes';
import type { DatePickerInputPartAttributes } from './useDatePickerState';

interface DatePickerDateInputProps {
    pt: DatePickerInputPassThrough | undefined;
    inputPartAttributes: DatePickerInputPartAttributes;
    placeholder: string | undefined;
    state: DatePickerFieldState;
    isOpen: boolean;
}

/** The segmented date input, whose parts carry the picker's state as data attributes. */
export const DatePickerDateInput = ({
    pt,
    inputPartAttributes,
    placeholder,
    state,
    isOpen,
}: DatePickerDateInputProps) => (
    <DateInput
        {...inputPartAttributes}
        className={classNames('cratis-date-picker__input', pt?.input?.className)}
        style={pt?.input?.style}
        data-cratis-part='input'
        data-placeholder={placeholder}
        render={(inputProps) => <div {...inputProps} {...fieldStateAttributes(state, isOpen)} />}
    >
        {(segment) => (
            <DateSegment
                {...pt?.segment}
                segment={segment}
                className={classNames('cratis-date-picker__segment', pt?.segment?.className)}
                data-cratis-part='segment'
                render={(segmentProps) => (
                    <span {...segmentProps} {...segmentStateAttributes(state)} />
                )}
            />
        )}
    </DateInput>
);
