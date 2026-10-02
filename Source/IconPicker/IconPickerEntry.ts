// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { IconPickerValue } from './IconPickerValue';

/**
 * One icon in an {@link IconPickerCatalog}: its qualified identity, how to find it, and how to draw it.
 * Extends {@link IconPickerValue}, so the identity fields are exactly the ones the picker emits.
 */
export interface IconPickerEntry extends IconPickerValue {
    /** The name shown beneath the icon and matched by search. */
    name: string;

    /** The categories the icon is listed under. An icon with none is listed under an "other" group. */
    categories: readonly string[];

    /** Extra words that find the icon in a search. */
    tags?: readonly string[];

    /** Alternative names that find the icon in a search. */
    aliases?: readonly string[];

    /** Marks the icon as deprecated: it stays selectable and visible, flagged so people can move off it. */
    deprecated?: boolean;

    /**
     * Draws the icon. Called lazily - only for icons scrolled into view - and never for an icon that
     * stays off screen, so a large library costs nothing until it is browsed.
     * @returns The icon's glyph, sized by the surrounding icon area.
     */
    renderPreview: () => ReactNode;
}
