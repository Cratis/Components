// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import type { CheckboxParts, CheckboxProps } from './Checkbox';
import { useNativeChoice, type NativeChoiceState } from './useNativeChoice';
import { splitChoiceMarker } from './nativeChoiceMarker';

const renderPresentation = (label: CheckboxProps['label'], pt: CheckboxParts | undefined, state: NativeChoiceState, selected: boolean) => (
    <>
        <span
            {...pt?.box}
            className={['cratis-checkbox__box', pt?.box?.className].filter(Boolean).join(' ')}
            data-cratis-part='box'
            data-disabled={state.disabled || undefined}
            data-invalid={state.isInvalid || undefined}
            data-readonly={state.readOnly || undefined}
            data-selected={selected || undefined}
            aria-hidden='true'
        >
            <span
                {...pt?.indicator}
                className={['cratis-checkbox__indicator', pt?.indicator?.className].filter(Boolean).join(' ')}
                data-cratis-part='indicator'
                data-disabled={state.disabled || undefined}
                data-invalid={state.isInvalid || undefined}
                data-readonly={state.readOnly || undefined}
                data-selected={selected || undefined}
            >✓</span>
        </span>
        {label !== undefined && (
            <span
                {...pt?.label}
                className={['cratis-choice__label', pt?.label?.className].filter(Boolean).join(' ')}
                data-cratis-part='label'
                data-disabled={state.disabled || undefined}
                data-invalid={state.isInvalid || undefined}
                data-readonly={state.readOnly || undefined}
                data-selected={selected || undefined}
            >{label}</span>
        )}
    </>
);

/** Core implementation for the native checkbox presentation slot. */
export const CheckboxImplementation = forwardRef<HTMLInputElement, CheckboxProps>(function CheckboxImplementation(
    props,
    forwardedRef,
) {
    const {
        label, className, style, pt, invalid: _invalid, onChange: _onChange, onClick: _onClick,
        disabled: _disabled, readOnly: _readOnly, checked: _checked, defaultChecked: _defaultChecked,
        'aria-invalid': _ariaInvalid, ...inputProps
    } = props;
    const [nativeProps, marker] = splitChoiceMarker(inputProps);
    const state = useNativeChoice(props, forwardedRef);
    const { disabled, readOnly, ariaInvalid, isInvalid, inputRef, selected, checked, defaultChecked, onClick, onChange } = state;
    return (
        <label
            {...pt?.root}
            className={['cratis-choice', pt?.root?.className, className].filter(Boolean).join(' ')}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
            data-cratis-component='Checkbox'
            {...marker}
            data-disabled={disabled || undefined}
            data-invalid={isInvalid || undefined}
            data-readonly={readOnly || undefined}
            data-selected={selected || undefined}
        >
            <input
                {...pt?.input}
                {...nativeProps}
                ref={inputRef}
                type='checkbox'
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled}
                readOnly={undefined}
                aria-invalid={ariaInvalid}
                aria-readonly={readOnly || undefined}
                onClick={onClick}
                onChange={onChange}
                className={['cratis-choice__input', pt?.input?.className].filter(Boolean).join(' ')}
                data-cratis-part='input'
                data-disabled={disabled || undefined}
                data-invalid={isInvalid || undefined}
                data-readonly={readOnly || undefined}
                data-selected={selected || undefined}
            />
            {renderPresentation(label, pt, state, selected)}
        </label>
    );
});
