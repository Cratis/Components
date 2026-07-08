// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode } from 'react';
import { normalizeIconClass } from './normalizeIconClass';

// Module-scoped ambient so the dev-only warning below type-checks without pulling in Node
// types (the library's tsconfig sets `types: []`). Bundlers replace `process.env.NODE_ENV`
// with a literal; the `typeof` guard keeps it safe where `process` is genuinely absent.
declare const process: { env: Record<string, string | undefined> };

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
 *   CSS class and rendered as `<i className={icon} />`. A lone PrimeIcons class missing its
 *   base `pi` class (`'pi-home'`) is repaired to `'pi pi-home'`, and a bare icon name
 *   (`'plus'`) that would silently render nothing logs a development warning.
 * - Otherwise the value is rendered as-is, allowing any React node (SVG, component, etc.)
 *   to be used as an icon.
 */
export const IconDisplay = ({ icon, className }: IconDisplayProps) => {
    if (typeof icon === 'string') {
        const { className: resolved, warning } = normalizeIconClass(icon);
        const isDevelopment = typeof process === 'undefined' || process.env.NODE_ENV !== 'production';
        if (warning && isDevelopment) {
            console.warn(warning);
        }
        if (resolved.length === 0) {
            return <></>;
        }
        const combined = className ? `${resolved} ${className}` : resolved;
        return <i className={combined} />;
    }
    return <>{icon}</>;
};
