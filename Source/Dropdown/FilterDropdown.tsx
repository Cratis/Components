// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ComboBox, ComboBoxValue } from 'react-aria-components/ComboBox';
import { UNSAFE_PortalProvider } from 'react-aria';
import { classNames } from '../ClassNames/classNames';
import { ComboBoxCommitBridge } from './ComboBoxCommitBridge';
import type { DropdownBranchProps } from './DropdownBranchProps';
import { ComboBoxOptionList } from './DropdownOptionLists';
import {
    DropdownClearButton,
    DropdownComboBoxTrigger,
    DropdownFilterInput,
    DropdownRoot,
} from './DropdownParts';
import { selectedKeysOf } from './resolveOptions';

/**
 * The filterable dropdown, single or multiple: a React Aria ComboBox. One component serves both
 * selection modes so switching `multiple` keeps the ComboBox and the filter input mounted.
 */
export const FilterDropdown = <T,>({ props, state, handlers }: DropdownBranchProps<T>) => {
    const { pt, value, multiple, placeholder, filterPlaceholder, disabled, name, tabIndex, showClear, style, onBlur, panelClassName } = props;
    const { selectedKey, isOpen, effectiveInvalid } = state;
    const selectedKeys = multiple ? selectedKeysOf(value, state.resolvedOptions) : [];
    const selected = multiple ? selectedKeys.length > 0 : selectedKey !== null;
    const isSelected = (key: string) => (multiple ? selectedKeys.includes(key) : key === selectedKey);
    const common = {
        onOpenChange: state.setIsOpen,
        isDisabled: disabled,
        isInvalid: effectiveInvalid,
        name,
        'aria-label': state.effectiveAriaLabel,
        'aria-labelledby': state.effectiveAriaLabelledby,
        'aria-describedby': state.effectiveAriaDescribedby,
        allowsEmptyCollection: true,
        className: 'cratis-dropdown__combobox',
    };
    const body = (
        <>
            {multiple ? (
                <ComboBoxValue
                    {...pt?.value}
                    placeholder={placeholder}
                    className={classNames('cratis-dropdown__value', pt?.value?.className)}
                    data-cratis-part='value'
                    data-disabled={disabled || undefined}
                    data-invalid={effectiveInvalid || undefined}
                    data-open={isOpen || undefined}
                    data-selected={selected || undefined}
                />
            ) : (
                <ComboBoxCommitBridge handle={state.comboBox} />
            )}
            <DropdownFilterInput
                pt={pt}
                inputRef={state.attachExternalLabel}
                id={state.triggerId}
                placeholder={filterPlaceholder ?? placeholder}
                tabIndex={tabIndex}
                invalid={effectiveInvalid}
                disabled={disabled}
                open={isOpen}
            />
            <DropdownComboBoxTrigger
                pt={pt}
                disabled={disabled}
                invalid={effectiveInvalid}
                selected={selected}
                label={state.showOptionsLabel}
                icon={state.expandIcon}
            />
            {showClear && selected && (
                <DropdownClearButton
                    pt={pt}
                    disabled={disabled}
                    label={state.clearSelectionLabel}
                    icon={state.clearIcon}
                    onClick={multiple ? handlers.clearSelections : handlers.clearSelection}
                />
            )}
            <ComboBoxOptionList
                pt={pt}
                panelClassName={panelClassName}
                zIndex={state.resolvedPopoverZIndex}
                options={state.resolvedOptions}
                isSelected={isSelected}
            />
        </>
    );

    return (
        <DropdownRoot
            pt={pt}
            className={state.rootClassName}
            style={style}
            onBlur={onBlur}
            invalid={effectiveInvalid}
            disabled={disabled}
            open={isOpen}
            selected={selected}
        >
            <UNSAFE_PortalProvider getContainer={state.overlayEnvironment.getContainer}>
                {multiple ? (
                    <ComboBox {...common} selectionMode='multiple' value={selectedKeys} onChange={handlers.selectOptions}>
                        {body}
                    </ComboBox>
                ) : (
                    <ComboBox {...common} value={selectedKey} onChange={handlers.selectOption}>
                        {body}
                    </ComboBox>
                )}
            </UNSAFE_PortalProvider>
        </DropdownRoot>
    );
};
