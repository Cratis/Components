// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    ListBox as ComboBoxListBox,
    ListBoxItem as ComboBoxListBoxItem,
    Popover as ComboBoxPopover,
} from 'react-aria-components/ComboBox';
import {
    ListBox,
    ListBoxItem,
    Popover,
} from 'react-aria-components/Select';
import { asReactAriaListBoxItemProps, asReactAriaListBoxProps } from '../Common/reactAriaProps';
import { classNames } from '../ClassNames/classNames';
import {
    popoverClassName,
    popoverStyle,
    type DropdownParts,
} from './dropdownAttributes';
import type { ResolvedOption } from './resolveOptions';

interface OptionListProps {
    pt: DropdownParts;
    panelClassName: string | undefined;
    zIndex: string;
    options: ResolvedOption[];
    isSelected: (key: string) => boolean;
}

// The ComboBox and Select families come from different React Aria contexts and are not interchangeable,
// so each keeps its own thin component over the shared attribute helpers.

/** The ComboBox popover with its listbox. */
export const ComboBoxOptionList = ({ pt, panelClassName, zIndex, options, isSelected }: OptionListProps) => (
    <ComboBoxPopover
        {...pt?.popover}
        className={popoverClassName(pt, panelClassName)}
        style={popoverStyle(pt, zIndex)}
        data-cratis-part='popover'
        data-open
    >
        <ComboBoxListBox
            {...asReactAriaListBoxProps<ResolvedOption>(pt?.listbox)}
            items={options}
            className={classNames('cratis-dropdown__listbox', pt?.listbox?.className)}
            data-cratis-part='listbox'
            data-open
        >
            {(option) => (
                <ComboBoxListBoxItem
                    {...asReactAriaListBoxItemProps<ResolvedOption>(pt?.option)}
                    id={option.key}
                    textValue={option.label}
                    isDisabled={option.disabled}
                    className={classNames('cratis-dropdown__option', pt?.option?.className)}
                    data-cratis-part='option'
                    data-disabled={option.disabled || undefined}
                    data-selected={isSelected(option.key) || undefined}
                >
                    {option.label}
                </ComboBoxListBoxItem>
            )}
        </ComboBoxListBox>
    </ComboBoxPopover>
);

/** The Select popover with its listbox. */
export const SelectOptionList = ({ pt, panelClassName, zIndex, options, isSelected }: OptionListProps) => (
    <Popover
        {...pt?.popover}
        className={popoverClassName(pt, panelClassName)}
        style={popoverStyle(pt, zIndex)}
        data-cratis-part='popover'
        data-open
    >
        <ListBox
            {...asReactAriaListBoxProps<ResolvedOption>(pt?.listbox)}
            items={options}
            className={classNames('cratis-dropdown__listbox', pt?.listbox?.className)}
            data-cratis-part='listbox'
            data-open
        >
            {(option) => (
                <ListBoxItem
                    {...asReactAriaListBoxItemProps<ResolvedOption>(pt?.option)}
                    id={option.key}
                    textValue={option.label}
                    isDisabled={option.disabled}
                    className={classNames('cratis-dropdown__option', pt?.option?.className)}
                    data-cratis-part='option'
                    data-disabled={option.disabled || undefined}
                    data-selected={isSelected(option.key) || undefined}
                >
                    {option.label}
                </ListBoxItem>
            )}
        </ListBox>
    </Popover>
);
