// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import {
    Button,
    DatePicker as AriaDatePicker,
} from 'react-aria-components/DatePicker';
import { UNSAFE_PortalProvider } from 'react-aria';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { asReactAriaButtonProps } from './reactAriaProps';
import type { DatePickerInputProps } from './DatePickerInput';
import { classNames } from '../ClassNames/classNames';
import { DatePickerDateInput } from './DatePickerDateInput';
import { DatePickerGroup, DatePickerPlaceholder } from './DatePickerGroup';
import { DatePickerPopover } from './DatePickerPopover';
import { asDate, asDateValue } from './datePickerValues';
import { rootStateAttributes, triggerStateAttributes } from './datePickerStateAttributes';
import { useDatePickerState } from './useDatePickerState';

const resolveHourCycle = (hourFormat: DatePickerInputProps['hourFormat']) => {
    if (hourFormat === '12') return 12;
    return hourFormat === '24' ? 24 : undefined;
};

/**
 * An internationalized date or date-time picker with Cratis-owned markup parts.
 * The public boundary remains `Date | null`; React Aria's calendar values stay internal.
 */
export const DatePickerInputImplementation = (props: DatePickerInputProps) => {
    const { value, onChange, onBlur, showButtonBar, isNonModal = false, showIcon = true, showTime, hourFormat, style, pt } = props;
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const state = useDatePickerState(props);
    const { effectiveDisabled, effectiveReadOnly } = state;
    const fieldState = {
        invalid: state.effectiveInvalid,
        disabled: effectiveDisabled,
        readOnly: effectiveReadOnly,
        selected: value !== null,
    };
    const buttonBar = showButtonBar ? {
        pt,
        todayLabel: state.resolvedTodayLabel,
        clearLabel: state.resolvedClearLabel,
        actionsDisabled: state.actionsDisabled,
        clearDisabled: state.clearDisabled,
        isTodayOutOfBounds: state.isTodayOutOfBounds,
        todayDate: state.todayDate,
        onChange,
    } : null;

    return (
        <div
            {...pt?.root}
            className={state.rootClassName}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
            data-cratis-component='DatePickerInput'
            {...rootStateAttributes(fieldState, isPickerOpen)}
            onBlur={onBlur}
        >
            <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
                <AriaDatePicker
                    value={asDateValue(value, showTime)}
                    onChange={(next) => onChange(asDate(next), { source: 'user' })}
                    isDisabled={effectiveDisabled}
                    isReadOnly={effectiveReadOnly}
                    isInvalid={state.effectiveInvalid}
                    isOpen={isPickerOpen}
                    onOpenChange={(nextIsOpen) => {
                        if (!nextIsOpen || !effectiveReadOnly) setIsPickerOpen(nextIsOpen);
                    }}
                    minValue={state.minValue}
                    maxValue={state.maxValue}
                    granularity={showTime ? 'minute' : 'day'}
                    hourCycle={resolveHourCycle(hourFormat)}
                    aria-label={state.effectiveAriaLabel}
                    aria-labelledby={state.effectiveAriaLabelledby}
                    aria-describedby={state.effectiveAriaDescribedby}
                    className='cratis-date-picker__picker'
                >
                    {({ isOpen }) => (
                        <>
                            <DatePickerGroup pt={pt} inputId={state.inputId} state={fieldState} isOpen={isOpen}>
                                <DatePickerDateInput
                                    pt={pt}
                                    inputPartAttributes={state.inputPartAttributes}
                                    placeholder={state.effectivePlaceholder}
                                    state={fieldState}
                                    isOpen={isOpen}
                                />
                                <DatePickerPlaceholder
                                    pt={pt}
                                    placeholder={state.effectivePlaceholder}
                                    selected={fieldState.selected}
                                />
                                {showIcon && (
                                    <Button
                                        {...asReactAriaButtonProps(pt?.trigger)}
                                        isDisabled={
                                            effectiveDisabled || effectiveReadOnly
                                        }
                                        className={classNames(
                                            'cratis-date-picker__trigger',
                                            pt?.trigger?.className,
                                        )}
                                        data-cratis-part='trigger'
                                        render={(triggerProps) => (
                                            <button
                                                {...triggerProps}
                                                {...triggerStateAttributes(fieldState, isOpen)}
                                            />
                                        )}
                                        aria-label={
                                            pt?.trigger?.['aria-label'] ??
                                            state.datePickerMessages?.openCalendar ??
                                            'Open calendar'
                                        }
                                    >
                                        <span aria-hidden='true'>▦</span>
                                    </Button>
                                )}
                            </DatePickerGroup>
                            <DatePickerPopover
                                pt={pt}
                                isNonModal={isNonModal}
                                zIndex={state.resolvedPopoverZIndex}
                                buttonBar={buttonBar}
                            />
                        </>
                    )}
                </AriaDatePicker>
            </UNSAFE_PortalProvider>
        </div>
    );
};
