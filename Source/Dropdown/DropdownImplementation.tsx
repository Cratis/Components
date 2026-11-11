// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { UNSAFE_PortalProvider } from 'react-aria';
import type { DropdownProps } from './Dropdown';
import { FilterDropdown } from './FilterDropdown';
import { MultipleSelectDropdown } from './MultipleSelectDropdown';
import { SingleSelectDropdown } from './SingleSelectDropdown';
import { useDropdownHandlers } from './useDropdownHandlers';
import { useDropdownState } from './useDropdownState';

/** A renderer-independent single or multiple select with stable Cratis parts. */
export const DropdownImplementation = <T = unknown,>(props: DropdownProps<T>) => {
    const state = useDropdownState(props);
    const handlers = useDropdownHandlers(props, state);
    const { overlayEnvironment } = state;
    const branch = { props, state, handlers };

    return (
        <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
            {props.filter && <FilterDropdown {...branch} />}
            {!props.filter && props.multiple && <MultipleSelectDropdown {...branch} />}
            {!props.filter && !props.multiple && <SingleSelectDropdown {...branch} />}
        </UNSAFE_PortalProvider>
    );
};

DropdownImplementation.displayName = 'DropdownImplementation';
