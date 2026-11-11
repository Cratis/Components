// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DropdownProps } from './Dropdown';
import { MultipleFilterDropdown } from './MultipleFilterDropdown';
import { MultipleSelectDropdown } from './MultipleSelectDropdown';
import { SingleFilterDropdown } from './SingleFilterDropdown';
import { SingleSelectDropdown } from './SingleSelectDropdown';
import { useDropdownHandlers } from './useDropdownHandlers';
import { useDropdownState } from './useDropdownState';

/** A renderer-independent single or multiple select with stable Cratis parts. */
export const DropdownImplementation = <T = unknown,>(props: DropdownProps<T>) => {
    const state = useDropdownState(props);
    const handlers = useDropdownHandlers(props, state);
    const branch = { props, state, handlers };

    if (props.multiple) {
        return props.filter ? <MultipleFilterDropdown {...branch} /> : <MultipleSelectDropdown {...branch} />;
    }
    return props.filter ? <SingleFilterDropdown {...branch} /> : <SingleSelectDropdown {...branch} />;
};

DropdownImplementation.displayName = 'DropdownImplementation';
