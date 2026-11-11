// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ComboBox } from 'react-aria-components/ComboBox';
import { UNSAFE_PortalProvider } from 'react-aria';
import { ComboBoxCommitBridge } from './ComboBoxCommitBridge';
import type { DropdownBranchProps } from './DropdownBranchProps';
import { ComboBoxOptionList } from './DropdownOptionLists';
import {
    DropdownClearButton,
    DropdownComboBoxTrigger,
    DropdownFilterInput,
    DropdownRoot,
} from './DropdownParts';

/** The single, filterable dropdown: a React Aria ComboBox whose commit is closed from outside. */
export const SingleFilterDropdown = <T,>({ props, state, handlers }: DropdownBranchProps<T>) => {
    const { pt, placeholder, filterPlaceholder, disabled, name, tabIndex, showClear, style, onBlur, panelClassName } = props;
    const { selectedKey, isOpen, effectiveInvalid } = state;
    const selected = selectedKey !== null;

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
                    onOpenChange={state.setIsOpen}
                    value={selectedKey}
                    onChange={handlers.selectOption}
                    isDisabled={disabled}
                    isInvalid={effectiveInvalid}
                    name={name}
                    aria-label={state.effectiveAriaLabel}
                    aria-labelledby={state.effectiveAriaLabelledby}
                    aria-describedby={state.effectiveAriaDescribedby}
                    allowsEmptyCollection
                    className='cratis-dropdown__combobox'
                >
                    <ComboBoxCommitBridge handle={state.comboBox} />
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
                            onClick={handlers.clearSelection}
                        />
                    )}
                    <ComboBoxOptionList
                        pt={pt}
                        panelClassName={panelClassName}
                        zIndex={state.resolvedPopoverZIndex}
                        options={state.resolvedOptions}
                        isSelected={(key) => key === selectedKey}
                    />
                </ComboBox>
            </UNSAFE_PortalProvider>
        </DropdownRoot>
    );
};
