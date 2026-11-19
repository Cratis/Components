// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from 'react';
import MuiInputBase from '@mui/material/InputBase';
import type { NumericInputProps } from '@cratis/components/Common';

type Root = NonNullable<NumericInputProps['pt']>['root'];
type AriaInvalid = NumericInputProps['aria-invalid'];
type DataAttributes = {
    [name: `data-${string}`]: string | number | boolean | undefined;
};

interface RootState {
    readonly disabled?: boolean;
    readonly readOnly?: boolean;
    readonly ariaInvalid: AriaInvalid;
    readonly invalid: boolean;
}

const resolveState = (props: NumericInputProps, root: Root): RootState => {
    const ariaInvalid = props['aria-invalid'] ?? root?.['aria-invalid'] ?? (props.invalid || undefined);
    return {
        disabled: props.disabled ?? root?.disabled,
        readOnly: props.readOnly ?? root?.readOnly,
        ariaInvalid,
        invalid: Boolean(props.invalid) || ariaInvalid === true || ariaInvalid === 'true',
    };
};

const stateAttributes = (state: RootState): DataAttributes => ({
    'data-disabled': state.disabled || undefined,
    'data-invalid': state.invalid || undefined,
    'data-readonly': state.readOnly || undefined,
});

const joinClassNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

const createChangeHandler =
    (root: Root, onChange: NumericInputProps['onChange']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
        root?.onChange?.(event);
        const next = event.currentTarget.valueAsNumber;
        onChange?.(Number.isNaN(next) ? undefined : next, {
            source: 'user',
            nativeEvent: event.nativeEvent,
        });
    };

/** Material UI implementation of the stable atomic `common.numberInput` slot. */
export const MuiNumberInputSlot = forwardRef<HTMLInputElement, NumericInputProps>(
    function MuiNumberInputSlot(props, ref) {
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
        const state = resolveState(props, root);
        const inputProps: InputHTMLAttributes<HTMLInputElement> & DataAttributes = {
            ...root,
            ...nativeProps,
            type: 'number',
            value: value ?? '',
            disabled: state.disabled,
            readOnly: state.readOnly,
            'aria-invalid': state.ariaInvalid,
            onChange: createChangeHandler(root, onChange),
            className: joinClassNames('cratis-mui-text-input', root?.className, className),
            style: { ...root?.style, ...style },
            'data-cratis-part': 'root',
            ...stateAttributes(state),
        };
        return (
            <MuiInputBase
                inputRef={ref}
                type='number'
                disabled={state.disabled}
                readOnly={state.readOnly}
                error={state.invalid}
                inputProps={inputProps}
            />
        );
    },
);
