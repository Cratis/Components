// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { Group } from 'react-aria-components/DatePicker';
import { classNames } from '../ClassNames/classNames';
import type { DatePickerInputPassThrough } from './DatePickerInput';
import { fieldStateAttributes, type DatePickerFieldState } from './datePickerStateAttributes';

interface DatePickerGroupProps {
    pt: DatePickerInputPassThrough | undefined;
    inputId: string | undefined;
    state: DatePickerFieldState;
    isOpen: boolean;
    children: ReactNode;
}

/** The focusable group that holds the segmented input, the placeholder and the calendar trigger. */
export const DatePickerGroup = ({ pt, inputId, state, isOpen, children }: DatePickerGroupProps) => (
    <Group
        {...pt?.group}
        id={inputId}
        aria-invalid={state.invalid || undefined}
        className={classNames('cratis-date-picker__group', pt?.group?.className)}
        data-cratis-part='group'
        data-empty={!state.selected || undefined}
        render={(groupProps) => <div {...groupProps} {...fieldStateAttributes(state, isOpen)} />}
    >
        {children}
    </Group>
);

interface DatePickerPlaceholderProps {
    pt: DatePickerInputPassThrough | undefined;
    placeholder: string | undefined;
    selected: boolean;
}

/** The visible placeholder shown while the picker has no value. */
export const DatePickerPlaceholder = ({ pt, placeholder, selected }: DatePickerPlaceholderProps) =>
    !selected && placeholder ? (
        <span
            {...pt?.placeholder}
            className={classNames('cratis-date-picker__placeholder', pt?.placeholder?.className)}
            data-cratis-part='placeholder'
            aria-hidden='true'
        >
            {placeholder}
        </span>
    ) : null;
