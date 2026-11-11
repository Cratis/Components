// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ComboBox, ComboBoxValue } from 'react-aria-components/ComboBox';
import { UNSAFE_PortalProvider } from 'react-aria';
import { classNames } from '../ClassNames/classNames';
import { flag } from './dropdownAttributes';
import type { DropdownBranchProps } from './DropdownBranchProps';
import { ComboBoxOptionList } from './DropdownOptionLists';
import {
    DropdownClearButton,
    DropdownComboBoxTrigger,
    DropdownFilterInput,
    DropdownRoot,
} from './DropdownParts';
import { selectedKeysOf } from './resolveOptions';

/** The multiple, filterable dropdown: a multi-selection React Aria ComboBox. */
export const MultipleFilterDropdown = <T,>({ props, state, handlers }: DropdownBranchProps<T>) => {
    const { pt, value, placeholder, filterPlaceholder, disabled, name, tabIndex, showClear, style, onBlur, panelClassName } = props;
    const { isOpen, effectiveInvalid } = state;
    const selectedKeys = selectedKeysOf(value, state.resolvedOptions);
    const selected = selectedKeys.length > 0;

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
                <ComboBox
                    selectionMode='multiple'
                    onOpenChange={state.setIsOpen}
                    value={selectedKeys}
                    onChange={handlers.selectOptions}
                    isDisabled={disabled}
                    isInvalid={effectiveInvalid}
                    name={name}
                    aria-label={state.effectiveAriaLabel}
                    aria-labelledby={state.effectiveAriaLabelledby}
                    aria-describedby={state.effectiveAriaDescribedby}
                    allowsEmptyCollection
                    className='cratis-dropdown__combobox'
                >
                    <ComboBoxValue
                        {...pt?.value}
                        placeholder={placeholder}
                        className={classNames('cratis-dropdown__value', pt?.value?.className)}
                        data-cratis-part='value'
                        data-disabled={flag(disabled)}
                        data-invalid={flag(effectiveInvalid)}
                        data-open={flag(isOpen)}
                        data-selected={flag(selected)}
                    />
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
                            onClick={handlers.clearSelections}
                        />
                    )}
                    <ComboBoxOptionList
                        pt={pt}
                        panelClassName={panelClassName}
                        zIndex={state.resolvedPopoverZIndex}
                        options={state.resolvedOptions}
                        isSelected={(key) => selectedKeys.includes(key)}
                    />
                </ComboBox>
            </UNSAFE_PortalProvider>
        </DropdownRoot>
    );
};
