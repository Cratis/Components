// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import { classNames } from '../ClassNames/classNames';
import { useCratisComponentsConfig } from './CratisComponentsProvider';
import { resolveDatePickerBounds } from './datePickerValues';
import type { DatePickerInputPassThrough, DatePickerInputProps } from './DatePickerInput';

type DatePickerStateInput = Pick<
    DatePickerInputProps,
    | 'invalid'
    | 'disabled'
    | 'readOnly'
    | 'id'
    | 'placeholder'
    | 'showTime'
    | 'minDate'
    | 'maxDate'
    | 'className'
    | 'pt'
    | 'todayLabel'
    | 'clearLabel'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-describedby'
>;

type DatePickerMessages = NonNullable<
    ReturnType<typeof useCratisComponentsConfig>['messages']
>['datePicker'];

const resolvePopoverZIndex = (nearestDialogZIndex: string | null) =>
    nearestDialogZIndex === null
        ? 'var(--cratis-z-index-overlay)'
        : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

const flag = (own: boolean | undefined, fromInput: boolean | undefined) => own ?? fromInput ?? false;

const resolveStateFlags = ({ invalid, disabled, readOnly, pt }: DatePickerStateInput) => ({
    effectiveDisabled: flag(disabled, pt?.input?.disabled),
    effectiveReadOnly: flag(readOnly, pt?.input?.readOnly),
    effectiveInvalid: flag(invalid, pt?.input?.['aria-invalid']),
});

const resolveActionFlags = (
    { effectiveDisabled, effectiveReadOnly }: ReturnType<typeof resolveStateFlags>,
    pt: DatePickerInputPassThrough | undefined,
) => {
    const actionsDisabled = effectiveDisabled || effectiveReadOnly;
    return { actionsDisabled, clearDisabled: actionsDisabled || pt?.clear?.disabled || false };
};

const resolveLabels = ({ todayLabel, clearLabel }: DatePickerStateInput, messages: DatePickerMessages) => ({
    resolvedTodayLabel: todayLabel ?? messages?.today ?? 'Today',
    resolvedClearLabel: clearLabel ?? messages?.clear ?? 'Clear',
});

const resolveAriaAssociations = (props: DatePickerStateInput) => ({
    inputId: props.id ?? props.pt?.input?.id,
    effectiveAriaLabelledby: props['aria-labelledby'] ?? props.pt?.input?.['aria-labelledby'],
    effectiveAriaDescribedby: props['aria-describedby'] ?? props.pt?.input?.['aria-describedby'],
});

const resolveAccessibleLabel = (props: DatePickerStateInput, messages: DatePickerMessages) => {
    const effectivePlaceholder = props.placeholder ?? props.pt?.input?.placeholder;
    return {
        effectivePlaceholder,
        effectiveAriaLabel: resolveAccessibleName(props['aria-label'], effectivePlaceholder, props.pt, messages),
    };
};

const resolveAccessibleName = (
    ariaLabel: string | undefined,
    placeholder: string | undefined,
    pt: DatePickerInputPassThrough | undefined,
    messages: DatePickerMessages,
) => ariaLabel ?? pt?.input?.['aria-label'] ?? placeholder ?? messages?.label ?? 'Date';

// Everything the input part carries except what the picker owns itself.
const inputPartAttributes = (pt: DatePickerInputPassThrough | undefined) => ({
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
});

export type DatePickerInputPartAttributes = ReturnType<typeof inputPartAttributes>;

/** Derives every effective value the date picker renders from its props, pass-through parts and provider messages. */
export const useDatePickerState = (props: DatePickerStateInput) => {
    const { pt, className, showTime, minDate, maxDate } = props;
    const nearestDialogZIndex = useNearestDialogZIndex();
    const datePickerMessages = useCratisComponentsConfig().messages?.datePicker;
    const stateFlags = resolveStateFlags(props);
    return {
        datePickerMessages,
        resolvedPopoverZIndex: resolvePopoverZIndex(nearestDialogZIndex),
        ...resolveLabels(props, datePickerMessages),
        ...resolveDatePickerBounds(minDate, maxDate, showTime),
        rootClassName: classNames('cratis-date-picker', pt?.root?.className, className),
        ...stateFlags,
        ...resolveActionFlags(stateFlags, pt),
        ...resolveAriaAssociations(props),
        ...resolveAccessibleLabel(props, datePickerMessages),
        inputPartAttributes: inputPartAttributes(pt),
    };
};
