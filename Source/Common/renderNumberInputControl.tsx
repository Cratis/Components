// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ClipboardEvent, CSSProperties, InputHTMLAttributes } from 'react';
import { Group, Input } from 'react-aria-components/NumberField';
import { classNames } from '../ClassNames/classNames';
import { NumberInputCommitReason } from './NumberInputCommitReason';
import type { NumberInputProps } from './NumberInputProps';
import { partAttributes } from './numberInputAttributes';
import type { useNumberInputState } from './useNumberInputState';
import { renderNumberInputPrefix, renderNumberInputSuffix } from './renderNumberInputAdornment';
import { renderNumberInputDecrement, renderNumberInputIncrement } from './renderNumberInputStep';

const handlePaste = (inputProps: InputHTMLAttributes<HTMLInputElement>, { latestValue }: ReturnType<typeof useNumberInputState>, { onCommit }: NumberInputProps) =>
    (event: ClipboardEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const isFullFieldPaste = (input.selectionStart ?? -1) === 0 && input.selectionEnd === input.value.length;
        inputProps.onPaste?.(event);
        // React Aria commits full-field paste text in its input handler. Emit
        // after that handler so change and commit remain one browser event
        // transaction instead of depending on queued controlled-render timing.
        if (isFullFieldPaste) onCommit?.(latestValue.current, NumberInputCommitReason.Paste);
    };

const renderInput = (props: NumberInputProps, state: ReturnType<typeof useNumberInputState>) => {
    const { pt, placeholder, required = false, disabled = false, invalid = false, readOnly = false } = props;
    const { errorId, describedBy } = state;
    return (
        <Input
            {...partAttributes(pt?.input)}
            placeholder={placeholder}
            aria-errormessage={errorId}
            className={classNames(
                                        'cratis-number-input__input',
                                        pt?.input?.className,
                                    )}
            style={pt?.input?.style as CSSProperties | undefined}
            render={(inputProps) => (
                <input
                    {...inputProps}
                    required={required}
                    onPaste={handlePaste(inputProps, state, props)}
                    aria-describedby={describedBy}
                    aria-errormessage={errorId}
                    data-cratis-part='input'
                    data-disabled={disabled || undefined}
                    data-invalid={invalid || undefined}
                    data-readonly={readOnly || undefined}
                />
            )}
        />
    );
};

export const renderNumberInputControl = (props: NumberInputProps, state: ReturnType<typeof useNumberInputState>) => {
    const { pt, showSteppers = true, disabled = false, invalid = false, readOnly = false } = props;
    return (
        <Group
            {...partAttributes(pt?.group)}
            className={classNames(
                                'cratis-number-input__group',
                                pt?.group?.className,
                            )}
            style={pt?.group?.style as CSSProperties | undefined}
            data-cratis-part='group'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
        >
            <div className='cratis-number-input__control'>
                {renderNumberInputPrefix(state.prefixId, props)}
                {renderInput(props, state)}
                {renderNumberInputSuffix(state.suffixId, props)}
            </div>
            {showSteppers && (
                <div className='cratis-number-input__steps'>
                    {renderNumberInputDecrement(props, state.scheduleCommit)}
                    {renderNumberInputIncrement(props, state.scheduleCommit)}
                </div>
            )}
        </Group>
    );
};
