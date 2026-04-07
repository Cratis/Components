// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode } from 'react';

/**
 * Represents an icon that can be either a PrimeIcons CSS class string (e.g. `'pi pi-home'`)
 * or any React node (e.g. an SVG element or a third-party icon component).
 */
export type Icon = string | ReactNode;

/** Props for the {@link IconDisplay} component. */
export interface IconDisplayProps {
    /** The icon to render — either a PrimeIcons CSS class or a React node. */
    icon: Icon;

    /** Optional additional CSS classes applied to the wrapping `<i>` when the icon is a string. */
    className?: string;
}

/**
 * Renders an {@link Icon} value.
 *
 * - When `icon` is a non-empty string it is treated as a PrimeIcons (or other icon-font)
 *   CSS class and rendered as `<i className={icon} />`.
 * - Otherwise the value is rendered as-is, allowing any React node (SVG, component, etc.)
 *   to be used as an icon.
 */
export const IconDisplay = ({ icon, className }: IconDisplayProps) => {
    if (typeof icon === 'string' && icon.length > 0) {
        const combined = className ? `${icon} ${className}` : icon;
        return <i className={combined} />;
    }
    return <>{icon}</>;
};
