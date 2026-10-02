// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import type { IconPickerLibrary } from './IconPickerLibrary';
import type { IconPickerParts } from './IconPickerParts';

/** Props for {@link IconPickerLibraryFilter}. */
export interface IconPickerLibraryFilterProps {
    /** The libraries on offer. */
    libraries: readonly IconPickerLibrary[];

    /** The id of the active library, or undefined for all. */
    selected: string | undefined;

    /** Changes the library filter. */
    onSelect: (library: string | undefined) => void;

    /** Accessible name of the filter. */
    label: string;

    /** The text of the option that shows every library. */
    allLabel: string;

    /** Pass-through attributes for the select. */
    parts?: Pick<IconPickerParts, 'library'>;
}

/** The library filter: a native select, so it works with every input mode. Shown only for several libraries. */
export const IconPickerLibraryFilter = ({ libraries, selected, onSelect, label, allLabel, parts }: IconPickerLibraryFilterProps) => (
    <select
        {...parts?.library}
        aria-label={label}
        value={selected ?? ''}
        className={classNames('cratis-icon-picker__library', parts?.library?.className)}
        data-cratis-part='library'
        onChange={event => onSelect(event.target.value === '' ? undefined : event.target.value)}
    >
        <option value=''>{allLabel}</option>
        {libraries.map(library => (
            <option key={library.id} value={library.id}>
                {library.name}
            </option>
        ))}
    </select>
);
