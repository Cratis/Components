// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Button as AriaButton, Input as AriaInput } from 'react-aria-components/ComboBox';
import { classNames } from '../ClassNames/classNames';
import { asReactAriaButtonProps } from './reactAriaProps';
import { partAttributes } from './comboBoxAttributes';
import type { ComboBoxProps } from './ComboBox';
import type { useComboBoxPresentation } from './useComboBoxPresentation';

export const renderComboBoxControl = (props: ComboBoxProps, presentation: ReturnType<typeof useComboBoxPresentation>, isOpen: boolean) => {
    const { pt, placeholder, disabled = false, invalid = false, readOnly = false } = props;
    const { inputId, errorId, expandIcon } = presentation;
    return (
        <div className='cratis-combobox__control'>
            <AriaInput
                {...partAttributes(pt?.input)}
                id={inputId}
                placeholder={placeholder}
                aria-errormessage={errorId}
                className={classNames('cratis-combobox__input', pt?.input?.className)}
                data-cratis-part='input'
                data-disabled={disabled || undefined}
                data-invalid={invalid || undefined}
                data-readonly={readOnly || undefined}
                data-open={isOpen || undefined}
            />
            <AriaButton
                {...asReactAriaButtonProps(partAttributes(pt?.trigger))}
                className={classNames('cratis-combobox__trigger', pt?.trigger?.className)}
                data-cratis-part='trigger'
                data-disabled={disabled || undefined}
                data-open={isOpen || undefined}
            >
                <span aria-hidden='true'>{expandIcon}</span>
            </AriaButton>
        </div>
    );
};
