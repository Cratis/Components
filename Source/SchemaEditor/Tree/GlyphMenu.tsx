// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type ReactNode } from 'react';
import { UNSAFE_PortalProvider } from 'react-aria';
import { Button } from 'react-aria-components/Button';
import { MenuTrigger, Popover, Menu, MenuItem } from 'react-aria-components/Menu';
import { zIndexAboveDialog, OVERLAY_OFFSET } from '../../renderer/dialogStack';
import { useNearestDialogZIndex } from '../../renderer/DialogStackContext';
import { unstable_useOverlayEnvironment } from '../../renderer/RendererContext';
import { PropertyType } from './PropertyType';
import { PropertyTypeGlyph } from './PropertyTypeGlyph';

/** One entry of a {@link GlyphMenu}. */
export interface GlyphMenuItem<TKey extends string | number> {
    /** What is reported when the entry is chosen. */
    key: TKey;
    /** The name shown beside the glyph. */
    label: string;
    /** The property type whose glyph and color the entry borrows. */
    glyph: PropertyType;
}

/** Props for {@link GlyphMenu}. */
export interface GlyphMenuProps<TKey extends string | number> {
    /** The entries, in order. */
    items: readonly GlyphMenuItem<TKey>[];
    /** The chosen entry. */
    value: TKey;
    /** Called with the key of the entry the user chose. */
    onChange: (key: TKey) => void;
    /** The accessible name of the menu and its trigger. */
    label: string;
    /** Stable name for tests and assistive technology. */
    name?: string;
    /** Disables the trigger. */
    disabled?: boolean;
}

/**
 * A single-choice menu that lists its entries the way the schema editor's type menu does: a colored glyph
 * followed by the name. The trigger shows the chosen entry the same way.
 */
export const GlyphMenu = <TKey extends string | number>({ items, value, onChange, label, name, disabled }: GlyphMenuProps<TKey>): ReactNode => {
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();
    const zIndex = nearestDialogZIndex === null
        ? 'var(--cratis-z-index-overlay)'
        : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);
    const chosen = items.find(item => item.key === value);

    return (
        <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
            <MenuTrigger>
                <Button
                    aria-label={label}
                    isDisabled={disabled}
                    className='cratis-schema-editor__type-button'
                    data-name={name}
                >
                    {chosen && <PropertyTypeGlyph type={chosen.glyph} />}
                    {chosen?.label}
                </Button>
                <Popover className='cratis-schema-editor__menu' style={{ zIndex }}>
                    <Menu
                        aria-label={label}
                        className='cratis-schema-editor__menu-list'
                        onAction={key => {
                            const picked = items.find(item => String(item.key) === String(key));
                            if (picked) onChange(picked.key);
                        }}
                    >
                        {items.map(item => (
                            <MenuItem key={String(item.key)} id={String(item.key)} textValue={item.label} className='cratis-schema-editor__menu-item'>
                                <PropertyTypeGlyph type={item.glyph} />
                                {item.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Popover>
            </MenuTrigger>
        </UNSAFE_PortalProvider>
    );
};
