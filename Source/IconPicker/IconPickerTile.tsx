// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { KeyboardEvent } from 'react';
import { FaCheck } from 'react-icons/fa6';
import { classNames } from '../ClassNames/classNames';
import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerParts } from './IconPickerParts';
import { useIsVisible } from './useIsVisible';

/** Props for {@link IconPickerTile}. */
export interface IconPickerTileProps {
    /** The icon the tile stands for. */
    entry: IconPickerEntry;

    /** Whether this icon is the current selection. */
    selected: boolean;

    /** Whether the field accepts this icon. An icon it does not accept is shown but cannot be chosen. */
    allowed: boolean;

    /** The name of the icon's library, shown when several libraries are offered. */
    providerName?: string;

    /** The text marking a deprecated icon. */
    deprecatedLabel: string;

    /** The text saying why an icon cannot be chosen. */
    notAllowedLabel: string;

    /** Picks the icon. */
    onChoose: (entry: IconPickerEntry) => void;

    /** The roving-focus props: tab stop, index marker and focus handler. */
    roving: { tabIndex: number; onFocus: () => void; [attribute: `data-${string}`]: number };

    /** Pass-through attributes for the tile and its inner parts. */
    parts?: Pick<IconPickerParts, 'tile' | 'tileIcon' | 'tileName' | 'provider'>;
}

/**
 * One selectable icon: a bordered tile with the glyph centered in a fixed icon area and the name
 * always visible and centered beneath it. The glyph is only drawn once the tile nears the viewport.
 *
 * Selection is shown by a check mark and a heavier border, and focus by an offset outline, so neither
 * depends on color alone. An icon the field does not accept stays focusable and explains itself.
 */
export const IconPickerTile = ({
    entry,
    selected,
    allowed,
    providerName,
    deprecatedLabel,
    notAllowedLabel,
    onChoose,
    roving,
    parts,
}: IconPickerTileProps) => {
    const { ref, isVisible } = useIsVisible();
    const choose = () => {
        if (allowed) onChoose(entry);
    };
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        choose();
    };

    return (
        <div
            {...parts?.tile}
            {...roving}
            ref={ref}
            role='option'
            aria-selected={selected}
            aria-disabled={!allowed || undefined}
            title={entry.name}
            className={classNames('cratis-icon-picker__tile', parts?.tile?.className)}
            data-cratis-part='tile'
            data-selected={selected || undefined}
            data-disabled={!allowed || undefined}
            data-deprecated={entry.deprecated || undefined}
            onClick={choose}
            onKeyDown={onKeyDown}
        >
            <span
                {...parts?.tileIcon}
                aria-hidden='true'
                className={classNames('cratis-icon-picker__tile-icon', parts?.tileIcon?.className)}
                data-cratis-part='tileIcon'
            >
                {isVisible ? entry.renderPreview() : null}
            </span>
            <span
                {...parts?.tileName}
                className={classNames('cratis-icon-picker__tile-name', parts?.tileName?.className)}
                data-cratis-part='tileName'
            >
                {entry.name}
            </span>
            {providerName !== undefined && (
                <span
                    {...parts?.provider}
                    className={classNames('cratis-icon-picker__provider', parts?.provider?.className)}
                    data-cratis-part='provider'
                >
                    {providerName}
                </span>
            )}
            {entry.deprecated && <span className='cratis-icon-picker__flag'>{deprecatedLabel}</span>}
            {!allowed && <span className='cratis-icon-picker__flag'>{notAllowedLabel}</span>}
            {selected && <FaCheck className='cratis-icon-picker__check' aria-hidden='true' focusable='false' />}
        </div>
    );
};
