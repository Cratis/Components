// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { NumberInputProps } from './NumberInputProps';
import { partAttributes } from './numberInputAttributes';

export const renderNumberInputPrefix = (prefixId: string | undefined, { prefix, pt, disabled = false, invalid = false, readOnly = false }: NumberInputProps) => prefixId && (
    <span
        {...partAttributes(pt?.prefix)}
        id={prefixId}
        className={classNames(
                                            'cratis-number-input__adornment',
                                            'cratis-number-input__prefix',
                                            pt?.prefix?.className,
                                        )}
        style={
                                            pt?.prefix?.style as CSSProperties | undefined
                                        }
        data-cratis-part='prefix'
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={readOnly || undefined}
    >
        {prefix}
    </span>
);

export const renderNumberInputSuffix = (suffixId: string | undefined, { suffix, pt, disabled = false, invalid = false, readOnly = false }: NumberInputProps) => suffixId && (
    <span
        {...partAttributes(pt?.suffix)}
        id={suffixId}
        className={classNames(
                                            'cratis-number-input__adornment',
                                            'cratis-number-input__suffix',
                                            pt?.suffix?.className,
                                        )}
        style={
                                            pt?.suffix?.style as CSSProperties | undefined
                                        }
        data-cratis-part='suffix'
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={readOnly || undefined}
    >
        {suffix}
    </span>
);
