// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ListBoxItem as AriaListBoxItem } from 'react-aria-components/ComboBox';
import { classNames } from '../ClassNames/classNames';
import { asReactAriaListBoxItemProps } from './reactAriaProps';
import { partAttributes } from './comboBoxAttributes';
import { ACTION_KEY } from './useComboBoxItems';
import type { ComboBoxOption, ComboBoxProps } from './ComboBox';

const renderComboBoxAction = ({ pt, action }: ComboBoxProps) => (
    <AriaListBoxItem
        {...asReactAriaListBoxItemProps<ComboBoxOption>(partAttributes(pt?.action))}
        id={ACTION_KEY}
        textValue={action?.label ?? ''}
        className={classNames('cratis-combobox__action', pt?.action?.className)}
        data-cratis-part='action'
    >
        {action?.label}
    </AriaListBoxItem>
);

export const renderComboBoxOption = (option: ComboBoxOption, props: ComboBoxProps) => {
    const { pt, value } = props;
    if (option.key === ACTION_KEY) return renderComboBoxAction(props);
    return (
        <AriaListBoxItem
            {...asReactAriaListBoxItemProps<ComboBoxOption>(partAttributes(pt?.option))}
            id={option.key}
            textValue={option.label}
            isDisabled={option.disabled}
            className={classNames('cratis-combobox__option', pt?.option?.className)}
            data-cratis-part='option'
            data-disabled={option.disabled || undefined}
            data-selected={option.key === value || undefined}
        >
            <span
                {...partAttributes(pt?.optionLabel)}
                className={classNames('cratis-combobox__option-label', pt?.optionLabel?.className)}
                data-cratis-part='optionLabel'
            >
                {option.label}
            </span>
            {option.description !== undefined && (
                <span
                    {...partAttributes(pt?.optionDescription)}
                    className={classNames('cratis-combobox__option-description', pt?.optionDescription?.className)}
                    data-cratis-part='optionDescription'
                >
                    {option.description}
                </span>
            )}
        </AriaListBoxItem>
    );
};
