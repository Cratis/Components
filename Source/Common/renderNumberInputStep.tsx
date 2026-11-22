// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { Button } from 'react-aria-components/NumberField';
import { classNames } from '../ClassNames/classNames';
import { NumberInputCommitReason } from './NumberInputCommitReason';
import type { NumberInputProps } from './NumberInputProps';
import { partAttributes } from './numberInputAttributes';

export const renderNumberInputDecrement = (
    { pt, 'aria-labelledby': ariaLabelledBy, invalid = false, readOnly = false }: NumberInputProps,
    scheduleCommit: (reason: NumberInputCommitReason) => void,
) => (
    <Button
        {...partAttributes(pt?.step)}
        slot='decrement'
        className={classNames(
                                            'cratis-number-input__step',
                                            pt?.step?.className,
                                        )}
        style={
                                            pt?.step?.style as CSSProperties | undefined
                                        }
        onPress={() => scheduleCommit(NumberInputCommitReason.Step)}
        render={(buttonProps) => (
            <button
                {...buttonProps}
                aria-labelledby={ariaLabelledBy
                    ? [buttonProps.id, ariaLabelledBy].filter(Boolean).join(' ')
                    : buttonProps['aria-labelledby']}
                data-cratis-part='step'
                data-step='decrement'
                data-disabled={buttonProps.disabled || undefined}
                data-invalid={invalid || undefined}
                data-readonly={readOnly || undefined}
            />
        )}
    >
        <span aria-hidden='true'>−</span>
    </Button>
);

export const renderNumberInputIncrement = (
    { pt, 'aria-labelledby': ariaLabelledBy, invalid = false, readOnly = false }: NumberInputProps,
    scheduleCommit: (reason: NumberInputCommitReason) => void,
) => (
    <Button
        {...partAttributes(pt?.step)}
        slot='increment'
        className={classNames(
                                            'cratis-number-input__step',
                                            pt?.step?.className,
                                        )}
        style={
                                            pt?.step?.style as CSSProperties | undefined
                                        }
        onPress={() => scheduleCommit(NumberInputCommitReason.Step)}
        render={(buttonProps) => (
            <button
                {...buttonProps}
                aria-labelledby={ariaLabelledBy
                    ? [buttonProps.id, ariaLabelledBy].filter(Boolean).join(' ')
                    : buttonProps['aria-labelledby']}
                data-cratis-part='step'
                data-step='increment'
                data-disabled={buttonProps.disabled || undefined}
                data-invalid={invalid || undefined}
                data-readonly={readOnly || undefined}
            />
        )}
    >
        <span aria-hidden='true'>+</span>
    </Button>
);
