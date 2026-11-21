// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ChangeEvent, type ChangeEventHandler } from 'react';
import { Input as DsInput, Textarea as DsTextarea } from '@digdir/designsystemet-react';
import type { NumericInputProps, TextAreaProps, TextInputProps } from '@cratis/components/Common';
import { classNames } from './classNames.js';

type AriaInvalid = TextInputProps['aria-invalid'];

const resolveInvalid = (
    invalid: boolean,
    ariaInvalid: AriaInvalid,
    partAriaInvalid: AriaInvalid,
) => {
    const effective = ariaInvalid ?? partAriaInvalid ?? (invalid || undefined);
    return {
        ariaInvalid: effective,
        invalid: invalid || effective === true || effective === 'true',
    };
};

const resolveFieldState = (
    props: Pick<TextInputProps, 'invalid' | 'aria-invalid' | 'disabled' | 'readOnly'>,
    root: Pick<TextInputProps, 'aria-invalid' | 'disabled' | 'readOnly'> | undefined,
) => {
    const state = resolveInvalid(props.invalid ?? false, props['aria-invalid'], root?.['aria-invalid']);
    return {
        ...state,
        disabled: props.disabled ?? root?.disabled,
        readOnly: props.readOnly ?? root?.readOnly,
    };
};

const createTextChangeHandler = <T extends HTMLInputElement | HTMLTextAreaElement>(
    root: { onChange?: ChangeEventHandler<T> } | undefined,
    onChange: TextInputProps['onChange'],
) => (event: ChangeEvent<T>) => {
    root?.onChange?.(event);
    onChange?.(event.currentTarget.value, {
        source: 'user',
        nativeEvent: event.nativeEvent,
    });
};

/** Designsystemet implementation of `common.textInput`. */
export const DesignsystemetTextInputSlot = forwardRef<HTMLInputElement, TextInputProps>(
    function DesignsystemetTextInputSlot(
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
        const root = pt?.root;
        const state = resolveFieldState({ invalid, 'aria-invalid': ariaInvalid, disabled, readOnly }, root);
        return (
            <DsInput
                {...root}
                {...nativeProps}
                ref={ref}
                type={type}
                disabled={state.disabled}
                readOnly={state.readOnly}
                aria-invalid={state.ariaInvalid}
                onChange={createTextChangeHandler<HTMLInputElement>(root, onChange)}
                className={classNames('cratis-designsystemet-text-input', root?.className, className)}
                style={{ ...root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={state.disabled || undefined}
                data-invalid={state.invalid || undefined}
                data-readonly={state.readOnly || undefined}
            />
        );
    },
);

type NumberRoot = NonNullable<NumericInputProps['pt']>['root'];

const createNumberChangeHandler =
    (root: NumberRoot, onChange: NumericInputProps['onChange']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
        root?.onChange?.(event);
        const next = event.currentTarget.valueAsNumber;
        onChange?.(Number.isNaN(next) ? undefined : next, {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };

/** Designsystemet implementation of the stable atomic `common.numberInput` slot. */
export const DesignsystemetNumberInputSlot = forwardRef<HTMLInputElement, NumericInputProps>(
    function DesignsystemetNumberInputSlot(props, ref) {
        const {
            value,
            invalid: _invalid,
            onChange,
            pt,
            className,
            style,
            disabled: _disabled,
            readOnly: _readOnly,
            'aria-invalid': _ariaInvalid,
            ...nativeProps
        } = props;
        const root = pt?.root;
        const state = resolveFieldState(props, root);
        return (
            <DsInput
                {...root}
                {...nativeProps}
                ref={ref}
                type='number'
                value={value ?? ''}
                disabled={state.disabled}
                readOnly={state.readOnly}
                aria-invalid={state.ariaInvalid}
                onChange={createNumberChangeHandler(root, onChange)}
                className={classNames('cratis-designsystemet-text-input', root?.className, className)}
                style={{ ...root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={state.disabled || undefined}
                data-invalid={state.invalid || undefined}
                data-readonly={state.readOnly || undefined}
            />
        );
    },
);

/** Designsystemet implementation of `common.textArea`. */
export const DesignsystemetTextAreaSlot = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function DesignsystemetTextAreaSlot(
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
        const root = pt?.root;
        const state = resolveFieldState({ invalid, 'aria-invalid': ariaInvalid, disabled, readOnly }, root);
        return (
            <DsTextarea
                {...root}
                {...nativeProps}
                ref={ref}
                disabled={state.disabled}
                readOnly={state.readOnly}
                aria-invalid={state.ariaInvalid}
                onChange={createTextChangeHandler<HTMLTextAreaElement>(root, onChange)}
                className={classNames('cratis-designsystemet-text-area', root?.className, className)}
                style={{ ...root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={state.disabled || undefined}
                data-invalid={state.invalid || undefined}
                data-readonly={state.readOnly || undefined}
            />
        );
    },
);
