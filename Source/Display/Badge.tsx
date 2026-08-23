// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';

/** Severity tone of a {@link Badge}. */
export type BadgeSeverity = 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast';

/** Props for {@link Badge}. */
export interface BadgeProps {
    /** The value shown inside the badge (e.g. a count). */
    value?: ReactNode;
    /** Severity tone (drives the color). */
    severity?: BadgeSeverity;
    /** Badge size. */
    size?: 'small' | 'large' | 'xlarge';
    /** When `circle`, renders as a dot/circle badge. */
    shape?: 'circle';
    /** Extra class name. */
    className?: string;
    /** Badge content (alternative to {@link value}). */
    children?: ReactNode;
}

/** A compact count or status badge. */
export const Badge = ({ value, severity = 'secondary', size = 'small', shape, className, children }: BadgeProps) => (
    <span
        className={['cratis-badge', className].filter(Boolean).join(' ')}
        data-cratis-part='root'
        data-severity={severity}
        data-size={size}
        data-shape={shape}
    >
        {value ?? children}
    </span>
);
