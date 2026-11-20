// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ChangeEvent, type HTMLAttributes } from 'react';
import { InputText as PrimeInputText } from 'primereact/inputtext/inputtext.cjs.js';
import { InputTextarea as PrimeInputTextarea } from 'primereact/inputtextarea/inputtextarea.cjs.js';
import type { TextAreaProps, TextInputProps } from '@cratis/components/Common';
import { classNames } from './shared.js';

type AriaInvalid = HTMLAttributes<HTMLElement>['aria-invalid'];

interface FieldRootPart {
    readonly disabled?: boolean;
    readonly readOnly?: boolean;
    readonly 'aria-invalid'?: AriaInvalid;
}

interface FieldStateInput {
    readonly invalid: boolean;
    readonly disabled: boolean | undefined;
    readonly readOnly: boolean | undefined;
    readonly ariaInvalid: AriaInvalid;
}

const resolveFieldState = (
    { invalid, disabled, readOnly, ariaInvalid }: FieldStateInput,
    root: FieldRootPart | undefined,
) => {
    const effectiveAriaInvalid =
        ariaInvalid ?? root?.['aria-invalid'] ?? (invalid || undefined);
    return {
        disabled: disabled ?? root?.disabled,
        readOnly: readOnly ?? root?.readOnly,
        ariaInvalid: effectiveAriaInvalid,
        invalid:
            invalid || effectiveAriaInvalid === true || effectiveAriaInvalid === 'true',
    };
};

type FieldState = ReturnType<typeof resolveFieldState>;

const fieldAttributes = (state: FieldState) => ({
    'data-cratis-part': 'root',
    'data-disabled': state.disabled || undefined,
    'data-invalid': state.invalid || undefined,
    'data-readonly': state.readOnly || undefined,
});

const fieldValue = (value: TextInputProps['value']) => {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value.join(',') : String(value);
};

const fieldChangeHandler =
    <Element extends HTMLInputElement | HTMLTextAreaElement>(
        partOnChange: ((event: ChangeEvent<Element>) => void) | undefined,
        onChange: TextInputProps['onChange'] | TextAreaProps['onChange'],
    ) =>
    (event: ChangeEvent<Element>) => {
        partOnChange?.(event);
        onChange?.(event.currentTarget.value, {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };

export const PrimeTextInputSlot = forwardRef<HTMLInputElement, TextInputProps>(
    function PrimeTextInputSlot(
        {
            type = 'text',
            invalid = false,
            onChange,
            pt,
            className,
            style,
            disabled,
            readOnly,
            size: nativeSize,
            value,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const { size: partSize, ...rootPart } = pt?.root ?? {};
        const state = resolveFieldState(
            { invalid, disabled, readOnly, ariaInvalid },
            rootPart,
        );
        return (
            <PrimeInputText
                {...rootPart}
                {...nativeProps}
                ref={ref}
                type={type}
                value={fieldValue(value)}
                disabled={state.disabled}
                readOnly={state.readOnly}
                invalid={state.invalid}
                aria-invalid={state.ariaInvalid}
                size={nativeSize ?? partSize}
                onChange={fieldChangeHandler(rootPart.onChange, onChange)}
                className={classNames(
                    'cratis-primereact10-text-input',
                    rootPart.className,
                    className,
                )}
                style={{ ...rootPart.style, ...style }}
                {...fieldAttributes(state)}
            />
        );
    },
);

export const PrimeTextAreaSlot = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function PrimeTextAreaSlot(
        {
            invalid = false,
            onChange,
            pt,
            className,
            style,
            disabled,
            readOnly,
            value,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const state = resolveFieldState(
            { invalid, disabled, readOnly, ariaInvalid },
            pt?.root,
        );
        return (
            <PrimeInputTextarea
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                value={fieldValue(value)}
                disabled={state.disabled}
                readOnly={state.readOnly}
                invalid={state.invalid}
                aria-invalid={state.ariaInvalid}
                onChange={fieldChangeHandler(pt?.root?.onChange, onChange)}
                className={classNames(
                    'cratis-primereact10-text-area',
                    pt?.root?.className,
                    className,
                )}
                style={{ ...pt?.root?.style, ...style }}
                {...fieldAttributes(state)}
            />
        );
    },
);
