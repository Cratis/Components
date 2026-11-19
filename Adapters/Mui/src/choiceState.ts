// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useRef, useState, type ForwardedRef, type InputHTMLAttributes } from 'react';
import type { CheckboxParts, CheckboxProps, RadioParts, RadioProps, SwitchParts, SwitchProps } from '@cratis/components/Common';
import { assignRef, type DataAttributes } from './shared.js';

export const useNativeCheckedState = (
    checked: boolean | undefined,
    defaultChecked: boolean | undefined,
    forwardedRef: ForwardedRef<HTMLInputElement>,
    options: { readonly observeRadioGroup?: boolean } = {},
) => {
    const observeRadioGroup = options.observeRadioGroup ?? false;
    const inputRef = useRef<HTMLInputElement>(null);
    const [uncontrolledChecked, setUncontrolledChecked] = useState(
        Boolean(defaultChecked),
    );
    const controlled = checked !== undefined;
    const ref = useCallback(
        (input: HTMLInputElement | null) => {
            inputRef.current = input;
            assignRef(forwardedRef, input);
        },
        [forwardedRef],
    );
    useEffect(() => {
        const input = inputRef.current;
        if (!input || controlled) return;
        const synchronize = () =>
            queueMicrotask(() => setUncontrolledChecked(input.checked));
        const form = input.form;
        form?.addEventListener('reset', synchronize);
        if (observeRadioGroup)
            input.ownerDocument.addEventListener('change', synchronize);
        return () => {
            form?.removeEventListener('reset', synchronize);
            if (observeRadioGroup)
                input.ownerDocument.removeEventListener('change', synchronize);
        };
    }, [controlled, observeRadioGroup]);
    return {
        ref,
        selected: checked ?? uncontrolledChecked,
        synchronize: (nextChecked: boolean) => {
            if (!controlled) setUncontrolledChecked(nextChecked);
        },
    };
};

export type NativeInputSlotProps = InputHTMLAttributes<HTMLInputElement> &
    React.RefAttributes<HTMLInputElement> &
    DataAttributes;

export const stateAttributes = (
    disabled: boolean | undefined,
    invalid: boolean,
    readOnly: boolean | undefined,
    selected: boolean,
) => ({
    'data-disabled': disabled || undefined,
    'data-invalid': invalid || undefined,
    'data-readonly': readOnly || undefined,
    'data-selected': selected || undefined,
});

export type ChoiceProps = CheckboxProps | RadioProps | SwitchProps;
export type ChoiceParts = CheckboxParts | RadioParts | SwitchParts;
export type ChoiceKind = 'checkbox' | 'radio' | 'switch';

export interface MuiChoiceProps {
    readonly kind: ChoiceKind;
    readonly props: ChoiceProps;
    readonly forwardedRef: ForwardedRef<HTMLInputElement>;
}

export type ChoiceStateAttributes = ReturnType<typeof stateAttributes>;

export interface ResolvedMuiChoice {
    readonly parts: ChoiceParts | undefined;
    readonly inputPart: InputHTMLAttributes<HTMLInputElement> | undefined;
    readonly checked: boolean | undefined;
    readonly defaultChecked: boolean | undefined;
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly ariaInvalid: InputHTMLAttributes<HTMLInputElement>['aria-invalid'];
    readonly state: ReturnType<typeof useNativeCheckedState>;
    readonly attributes: ChoiceStateAttributes;
}

export const useResolvedMuiChoice = (
    kind: ChoiceKind,
    props: ChoiceProps,
    forwardedRef: ForwardedRef<HTMLInputElement>,
): ResolvedMuiChoice => {
    const parts = props.pt as ChoiceParts | undefined;
    const inputPart = parts?.input as InputHTMLAttributes<HTMLInputElement> | undefined;
    const checked = props.checked ?? inputPart?.checked;
    const defaultChecked = props.defaultChecked ?? inputPart?.defaultChecked;
    const disabled = props.disabled ?? inputPart?.disabled;
    const readOnly = props.readOnly ?? inputPart?.readOnly;
    const ariaInvalid =
        props['aria-invalid'] ??
        inputPart?.['aria-invalid'] ??
        (props.invalid || undefined);
    const invalid =
        Boolean(props.invalid) || ariaInvalid === true || ariaInvalid === 'true';
    const state = useNativeCheckedState(checked, defaultChecked, forwardedRef, {
        observeRadioGroup: kind === 'radio',
    });
    return {
        parts,
        inputPart,
        checked,
        defaultChecked,
        disabled,
        readOnly,
        ariaInvalid,
        state,
        attributes: stateAttributes(disabled, invalid, readOnly, state.selected),
    };
};

