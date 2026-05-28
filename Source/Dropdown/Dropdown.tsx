// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Dropdown as PrimeDropdown, DropdownProps as PrimeDropdownProps } from 'primereact/dropdown';
import { useOverlayZIndex } from '../useOverlayZIndex';

/**
 * Props for {@link Dropdown}. Identical to PrimeReact's `DropdownProps` —
 * the wrapper does not add new props of its own.
 */
export type DropdownProps = PrimeDropdownProps;

/**
 * Thin wrapper around PrimeReact's `Dropdown` that fixes two ergonomic
 * issues for Cratis apps:
 *
 * - Defaults `appendTo` to `document.body` so dropdown panels escape parent
 *   scroll containers (a common gotcha inside dialogs and data table rows).
 * - Forces a high z-index on the dropdown panel via {@link useOverlayZIndex}
 *   so it appears above modal dialogs.
 *
 * The component forwards refs and spreads all other props, so it accepts
 * the full PrimeReact `Dropdown` API including `pt`, `ptOptions`, and
 * `unstyled` for restyling.
 */
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
