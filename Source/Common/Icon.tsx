// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode } from 'react';
import { normalizeIconClass } from './normalizeIconClass';

/** Represents either a React icon node or a consumer-owned icon-font class string. */
export type Icon = string | ReactNode;

/** Props for the {@link IconDisplay} component. */
export interface IconDisplayProps {
    /** React node or consumer-owned icon-font CSS class. */
    icon: Icon;

    /** Optional additional CSS classes applied to the wrapping `<i>` when the icon is a string. */
    className?: string;
}

/**
 * Renders an {@link Icon} value.
 *
 * - When `icon` is a non-empty string it is treated as a complete consumer-owned
 *   icon-font CSS class and rendered as `<i className={icon} />`.
 * - Otherwise the value is rendered as-is, allowing any React node (SVG, component, etc.)
 *   to be used as an icon.
 */
export const IconDisplay = ({ icon, className }: IconDisplayProps) => {
    if (typeof icon === 'string') {
        const { className: resolved } = normalizeIconClass(icon);
        if (resolved.length === 0) {
            return <></>;
        }
        const combined = className ? `${resolved} ${className}` : resolved;
        return <i className={combined} />;
    }
    return <>{icon}</>;
};
