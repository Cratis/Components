// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Select as AriaSelect } from 'react-aria-components/Select';
import { UNSAFE_PortalProvider } from 'react-aria';
import type { DropdownBranchProps } from './DropdownBranchProps';
import { SelectOptionList } from './DropdownOptionLists';
import { DropdownClearButton, DropdownRoot } from './DropdownParts';
import { SingleSelectTrigger } from './SingleSelectTrigger';

/** The single, unfiltered dropdown: a React Aria Select. */
export const SingleSelectDropdown = <T,>(branch: DropdownBranchProps<T>) => {
    const { props, state, handlers } = branch;
    const { pt, disabled, name, showClear, style, onBlur, panelClassName } = props;
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
                <AriaSelect
                    onOpenChange={state.setIsOpen}
                    value={selectedKey}
                    onChange={handlers.selectOption}
                    isDisabled={disabled}
                    isInvalid={effectiveInvalid}
                    name={name}
                    aria-label={state.effectiveAriaLabel}
                    aria-labelledby={state.effectiveAriaLabelledby}
                    aria-describedby={state.effectiveAriaDescribedby}
                    className='cratis-dropdown__select'
                >
                    <SingleSelectTrigger {...branch} />
                    {showClear && selected && (
                        <DropdownClearButton
                            pt={pt}
                            disabled={disabled}
                            label={state.clearSelectionLabel}
                            icon={state.clearIcon}
                            onClick={handlers.clearSelection}
                        />
                    )}
                    <SelectOptionList
                        pt={pt}
                        panelClassName={panelClassName}
                        zIndex={state.resolvedPopoverZIndex}
                        options={state.resolvedOptions}
                        isSelected={(key) => key === selectedKey}
                    />
                </AriaSelect>
            </UNSAFE_PortalProvider>
        </DropdownRoot>
    );
};
