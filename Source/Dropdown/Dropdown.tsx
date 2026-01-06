// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Dropdown as PrimeDropdown, DropdownProps as PrimeDropdownProps } from 'primereact/dropdown';
import { useOverlayZIndex } from '../useOverlayZIndex';

export type DropdownProps = PrimeDropdownProps;

export const Dropdown = React.forwardRef<PrimeDropdown, DropdownProps>((props, ref) => {
    // Force z-index on the dropdown panel to appear above dialogs
    useOverlayZIndex('p-dropdown-panel');

    return (
        <PrimeDropdown
            ref={ref}
            {...props}
            appendTo={props.appendTo ?? document.body}
        />
    );
});

Dropdown.displayName = 'Dropdown';
