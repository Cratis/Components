// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChangeEvent, ForwardedRef, InputHTMLAttributes, MouseEvent } from 'react';
import type { CheckboxProps } from './Checkbox';
import { useNativeCheckedState } from './useNativeCheckedState';

/** Resolved native state shared by the private choice renderers. */
export interface NativeChoiceState {
    disabled: boolean | undefined;
    readOnly: boolean | undefined;
    ariaInvalid: InputHTMLAttributes<HTMLInputElement>['aria-invalid'];
    isInvalid: boolean;
}

const resolveValidity = (props: CheckboxProps, input: InputHTMLAttributes<HTMLInputElement>) => {
    const ariaInvalid = props['aria-invalid'] ?? input['aria-invalid'];
    return {
        ariaInvalid: ariaInvalid ?? (props.invalid || undefined),
        isInvalid: Boolean(props.invalid || ariaInvalid === true || ariaInvalid === 'true'),
    };
};

const resolveState = (props: CheckboxProps, input: InputHTMLAttributes<HTMLInputElement>): NativeChoiceState => ({
    disabled: props.disabled ?? input.disabled,
    readOnly: props.readOnly ?? input.readOnly,
    ...resolveValidity(props, input),
});

const clickHandler = (props: CheckboxProps, input: InputHTMLAttributes<HTMLInputElement>, readOnly: boolean | undefined) =>
    (event: MouseEvent<HTMLInputElement>) => {
        input.onClick?.(event);
        props.onClick?.(event);
        if (readOnly) event.preventDefault();
    };

const changeHandler = (
    props: CheckboxProps,
    input: InputHTMLAttributes<HTMLInputElement>,
    readOnly: boolean | undefined,
    synchronize: (checked: boolean) => void,
    radio: boolean,
) => (event: ChangeEvent<HTMLInputElement>) => {
    input.onChange?.(event);
    if (readOnly || (radio && !event.currentTarget.checked)) return;
    synchronize(event.currentTarget.checked);
    props.onChange?.(event.currentTarget.checked, { source: 'user', nativeEvent: event.nativeEvent });
};

/** Resolves native precedence and event composition without changing input ownership. */
export const useNativeChoice = (props: CheckboxProps, ref: ForwardedRef<HTMLInputElement>, radio = false) => {
    const input = props.pt?.input ?? {};
    const checked = props.checked ?? input.checked;
    const defaultChecked = props.defaultChecked ?? input.defaultChecked;
    const checkedState = useNativeCheckedState(checked, defaultChecked, ref, radio);
    const state = resolveState(props, input);
    return {
        ...state,
        checked,
        defaultChecked,
        inputRef: checkedState.ref,
        selected: checkedState.selected,
        onClick: clickHandler(props, input, state.readOnly),
        onChange: changeHandler(props, input, state.readOnly, checkedState.synchronize, radio),
    };
};
