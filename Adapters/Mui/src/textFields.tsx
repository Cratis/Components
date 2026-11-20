// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    type ChangeEvent,
    type CSSProperties,
    type InputHTMLAttributes,
    type TextareaHTMLAttributes,
} from 'react';
import MuiInputBase from '@mui/material/InputBase';
import type { TextAreaProps, TextInputProps } from '@cratis/components/Common';
import { classNames, type DataAttributes } from './shared.js';

type AriaInvalid = InputHTMLAttributes<HTMLInputElement>['aria-invalid'];

interface TextFieldRoot<TElement extends HTMLInputElement | HTMLTextAreaElement> {
    readonly disabled?: boolean;
    readonly readOnly?: boolean;
    readonly 'aria-invalid'?: AriaInvalid;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly onChange?: (event: ChangeEvent<TElement>) => void;
}

interface TextFieldOptions<TElement extends HTMLInputElement | HTMLTextAreaElement> {
    readonly baseClassName: string;
    readonly root: TextFieldRoot<TElement> | undefined;
    readonly invalid: boolean;
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly ariaInvalid: AriaInvalid;
    readonly onChange: TextInputProps['onChange'];
    readonly className: string | undefined;
    readonly style: CSSProperties | undefined;
}

interface TextFieldState {
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly ariaInvalid: AriaInvalid;
    readonly invalid: boolean;
}

const isInvalidValue = (ariaInvalid: AriaInvalid) =>
    ariaInvalid === true || ariaInvalid === 'true';

const resolveTextFieldState = <TElement extends HTMLInputElement | HTMLTextAreaElement>({
    root,
    invalid,
    disabled,
    readOnly,
    ariaInvalid,
}: TextFieldOptions<TElement>): TextFieldState => {
    const effectiveAriaInvalid = ariaInvalid ?? root?.['aria-invalid'] ?? (invalid || undefined);
    return {
        disabled: disabled ?? root?.disabled,
        readOnly: readOnly ?? root?.readOnly,
        ariaInvalid: effectiveAriaInvalid,
        invalid: invalid || isInvalidValue(effectiveAriaInvalid),
    };
};

const textFieldAttributes = <TElement extends HTMLInputElement | HTMLTextAreaElement>(
    options: TextFieldOptions<TElement>,
    state: TextFieldState,
) => {
    const { baseClassName, root, onChange, className, style } = options;
    return {
        disabled: state.disabled,
        readOnly: state.readOnly,
        'aria-invalid': state.ariaInvalid,
        onChange: (event: ChangeEvent<TElement>) => {
            root?.onChange?.(event);
            onChange?.(event.currentTarget.value, {
                source: 'user',
                nativeEvent: event.nativeEvent,
            });
        },
        className: classNames(baseClassName, root?.className, className),
        style: { ...root?.style, ...style },
        'data-cratis-part': 'root',
        'data-disabled': state.disabled || undefined,
        'data-invalid': state.invalid || undefined,
        'data-readonly': state.readOnly || undefined,
    };
};

export const MuiTextInputSlot = forwardRef<HTMLInputElement, TextInputProps>(
    function MuiTextInputSlot(
        {
            type = 'text',
            invalid = false,
            onChange,
            pt,
            className,
            style,
            disabled,
            readOnly,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const options: TextFieldOptions<HTMLInputElement> = {
            baseClassName: 'cratis-mui-text-input',
            root: pt?.root,
            invalid,
            disabled,
            readOnly,
            ariaInvalid,
            onChange,
            className,
            style,
        };
        const state = resolveTextFieldState(options);
        const inputProps: InputHTMLAttributes<HTMLInputElement> & DataAttributes = {
            ...pt?.root,
            ...nativeProps,
            type,
            ...textFieldAttributes(options, state),
        };
        return (
            <MuiInputBase
                inputRef={ref}
                type={type}
                disabled={state.disabled}
                readOnly={state.readOnly}
                error={state.invalid}
                inputProps={inputProps}
            />
        );
    },
);

export const MuiTextAreaSlot = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function MuiTextAreaSlot(
        {
            invalid = false,
            onChange,
            pt,
            className,
            style,
            disabled,
            readOnly,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const options: TextFieldOptions<HTMLTextAreaElement> = {
            baseClassName: 'cratis-mui-text-area',
            root: pt?.root,
            invalid,
            disabled,
            readOnly,
            ariaInvalid,
            onChange,
            className,
            style,
        };
        const state = resolveTextFieldState(options);
        const inputProps: TextareaHTMLAttributes<HTMLTextAreaElement> & DataAttributes = {
            ...pt?.root,
            ...nativeProps,
            ...textFieldAttributes(options, state),
        };
        return (
            <MuiInputBase
                inputRef={ref}
                multiline
                inputComponent='textarea'
                disabled={state.disabled}
                readOnly={state.readOnly}
                error={state.invalid}
                inputProps={inputProps}
            />
        );
    },
);
