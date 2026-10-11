// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCratisComponentsConfig } from '../configuration/CratisComponentsContext';

interface FilterSearchBoxProps {
    search: string | undefined;
    placeholder: string;
    ariaLabel: string | undefined;
    onSearchChange: (value: string) => void;
}

/** The panel's search input. */
export function FilterSearchBox({ search, placeholder, ariaLabel, onSearchChange }: FilterSearchBoxProps) {
    const { messages } = useCratisComponentsConfig();
    return (
        <div className='pv-search'>
            <input
                type='search'
                placeholder={placeholder}
                aria-label={(ariaLabel ?? messages?.filter?.searchAriaLabel ?? placeholder) || 'Search'}
                value={search ?? ''}
                onChange={(event) => onSearchChange(event.target.value)}
            />
        </div>
    );
}
