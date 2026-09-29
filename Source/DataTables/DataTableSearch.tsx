// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../Common/classNames';
import type { DataTableParts } from './DataTableParts';

/** Props for {@link DataTableSearch}. */
export interface DataTableSearchProps {
    /** The table's part attributes. */
    parts?: DataTableParts;
    value: string;
    placeholder: string;
    ariaLabel: string;
    onChange: (value: string) => void;
}

/** The search box above a table that has search fields. */
export const DataTableSearch = ({
    parts: pt,
    value,
    placeholder,
    ariaLabel,
    onChange,
}: DataTableSearchProps) => (
    <div
        {...pt?.search}
        className={classNames('cratis-datatable-search', pt?.search?.className)}
        data-cratis-part='search'
    >
        <input
            {...pt?.searchInput}
            value={value}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={classNames(
                'cratis-datatable-search__input',
                pt?.searchInput?.className,
            )}
            data-cratis-part='search-input'
            onChange={(event) => onChange(event.target.value)}
        />
    </div>
);
