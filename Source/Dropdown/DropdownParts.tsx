// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MouseEventHandler, ReactNode, Ref } from 'react';
import { Button as ComboBoxButton, Input } from 'react-aria-components/ComboBox';
import { classNames } from '../ClassNames/classNames';
import { asReactAriaButtonProps } from '../Common/reactAriaProps';
import type { DropdownProps } from './Dropdown';
import { flag, type DropdownParts } from './dropdownAttributes';
import { renderTriggerWithOpenState } from './renderTriggerWithOpenState';

interface DropdownRootProps {
    pt: DropdownParts;
    className: string;
    style: DropdownProps['style'];
    onBlur: DropdownProps['onBlur'];
    invalid: boolean;
    disabled: boolean | undefined;
    open: boolean;
    selected: boolean;
    children: ReactNode;
}

/** The root element every dropdown variant renders; the parts differ only in what they hold. */
export const DropdownRoot = ({ pt, className, style, onBlur, invalid, disabled, open, selected, children }: DropdownRootProps) => (
    <span
        {...pt?.root}
        className={className}
        data-cratis-part='root'
        data-cratis-component='Dropdown'
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-open={open || undefined}
        data-selected={selected || undefined}
        style={{ ...pt?.root?.style, ...pt?.select?.style, ...style }}
        onBlur={onBlur}
    >
        {children}
    </span>
);

interface DropdownClearButtonProps {
    pt: DropdownParts;
    disabled: boolean | undefined;
    label: string;
    icon: ReactNode;
    onClick: MouseEventHandler<HTMLButtonElement>;
}

export const DropdownClearButton = ({ pt, disabled, label, icon, onClick }: DropdownClearButtonProps) => (
    <button
        {...pt?.clear}
        type='button'
        disabled={disabled}
        className={classNames('cratis-dropdown__clear', pt?.clear?.className)}
        data-cratis-part='clear'
        data-disabled={disabled || undefined}
        aria-label={label}
        onClick={onClick}
    >
        <span aria-hidden='true'>{icon}</span>
    </button>
);

interface DropdownFilterInputProps {
    pt: DropdownParts;
    inputRef: Ref<HTMLInputElement>;
    id: string | undefined;
    placeholder: string | undefined;
    tabIndex: number | undefined;
    invalid: boolean;
    disabled: boolean | undefined;
    open: boolean;
}

export const DropdownFilterInput = ({ pt, inputRef, id, placeholder, tabIndex, invalid, disabled, open }: DropdownFilterInputProps) => (
    <Input
        {...pt?.filter}
        ref={inputRef}
        id={id}
        placeholder={placeholder}
        tabIndex={tabIndex}
        aria-invalid={flag(invalid)}
        className={classNames('cratis-dropdown__filter', pt?.input?.className, pt?.filter?.className)}
        style={{ ...pt?.input?.style, ...pt?.filter?.style }}
        data-cratis-part='filter'
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-open={open || undefined}
    />
);

interface DropdownComboBoxTriggerProps {
    pt: DropdownParts;
    disabled: boolean | undefined;
    invalid: boolean;
    selected: boolean;
    label: string;
    icon: ReactNode;
}

export const DropdownComboBoxTrigger = ({ pt, disabled, invalid, selected, label, icon }: DropdownComboBoxTriggerProps) => (
    <ComboBoxButton
        {...asReactAriaButtonProps(pt?.trigger)}
        className={classNames('cratis-dropdown__indicator', pt?.trigger?.className)}
        data-cratis-part='trigger'
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
        data-selected={selected || undefined}
        render={renderTriggerWithOpenState}
        aria-label={label}
    >
        <span aria-hidden='true'>{icon}</span>
    </ComboBoxButton>
);
