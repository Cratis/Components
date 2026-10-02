// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerParts } from './IconPickerParts';
import { IconPickerTile } from './IconPickerTile';
import { iconPickerIdentity } from './iconPickerIdentity';
import { useGridColumns } from './useGridColumns';
import { useRovingFocus } from './useRovingFocus';

/** Props for {@link IconPickerGrid}. */
export interface IconPickerGridProps {
    /** The icons to list, in order. */
    entries: readonly IconPickerEntry[];

    /** The accessible name of the list. */
    label: string;

    /** The identity string of the selected icon, if any. */
    selectedIdentity: string | undefined;

    /** Tells whether the field accepts an icon. */
    isAllowed: (entry: IconPickerEntry) => boolean;

    /** Resolves a library id to the name shown on the tile, or undefined to show none. */
    providerName: (library: string) => string | undefined;

    /** The text marking a deprecated icon. */
    deprecatedLabel: string;

    /** The text saying why an icon cannot be chosen. */
    notAllowedLabel: string;

    /** Picks an icon. */
    onChoose: (entry: IconPickerEntry) => void;

    /** Pass-through attributes for the grid and its tiles. */
    parts?: IconPickerParts;
}

/**
 * A grid of {@link IconPickerTile}s with one Tab stop. Arrow keys move focus a tile or a row at a
 * time, and Home and End jump to the ends; the tab stop starts on the selected tile.
 */
export const IconPickerGrid = ({
    entries,
    label,
    selectedIdentity,
    isAllowed,
    providerName,
    deprecatedLabel,
    notAllowedLabel,
    onChoose,
    parts,
}: IconPickerGridProps) => {
    const gridRef = useRef<HTMLDivElement | null>(null);
    const columns = useGridColumns(gridRef);
    const selectedIndex = entries.findIndex(entry => iconPickerIdentity(entry) === selectedIdentity);
    const roving = useRovingFocus(entries.length, columns, selectedIndex);

    return (
        <div
            {...parts?.grid}
            ref={element => {
                gridRef.current = element;
                roving.containerRef.current = element;
            }}
            role='listbox'
            aria-label={label}
            className={classNames('cratis-icon-picker__grid', parts?.grid?.className)}
            data-cratis-part='grid'
            onKeyDown={roving.onKeyDown}
        >
            {entries.map((entry, index) => {
                const identity = iconPickerIdentity(entry);
                return (
                    <IconPickerTile
                        key={identity}
                        entry={entry}
                        selected={identity === selectedIdentity}
                        allowed={isAllowed(entry)}
                        providerName={providerName(entry.library)}
                        deprecatedLabel={deprecatedLabel}
                        notAllowedLabel={notAllowedLabel}
                        onChoose={onChoose}
                        roving={roving.itemProps(index)}
                        parts={parts}
                    />
                );
            })}
        </div>
    );
};
