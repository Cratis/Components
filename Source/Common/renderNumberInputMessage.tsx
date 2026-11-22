// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { NumberInputProps } from './NumberInputProps';
import { partAttributes } from './numberInputAttributes';

export const renderNumberInputDescription = (descriptionId: string | undefined, { description, pt }: NumberInputProps) => descriptionId && (
    <span
        {...partAttributes(pt?.description)}
        id={descriptionId}
        className={classNames(
                                    'cratis-number-input__description',
                                    pt?.description?.className,
                                )}
        style={
                                    pt?.description?.style as CSSProperties | undefined
                                }
        data-cratis-part='description'
    >
        {description}
    </span>
);

export const renderNumberInputError = (errorId: string | undefined, { errorMessage, pt }: NumberInputProps) => errorId && (
    <span
        {...partAttributes(pt?.error)}
        id={errorId}
        className={classNames(
                                    'cratis-number-input__error',
                                    pt?.error?.className,
                                )}
        style={pt?.error?.style as CSSProperties | undefined}
        data-cratis-part='error'
        data-invalid
    >
        {errorMessage}
    </span>
);
