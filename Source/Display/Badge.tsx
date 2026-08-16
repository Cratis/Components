// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Badge as PrimeBadge } from 'primereact/badge';

/** Severity tone of a {@link Badge}. */
export type BadgeSeverity = 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast';

/** Props for {@link Badge}. */
export interface BadgeProps {
    /** The value shown inside the badge (e.g. a count). */
    value?: React.ReactNode;
    /** Severity tone (drives the color). */
    severity?: BadgeSeverity;
    /** Badge size. */
    size?: 'small' | 'large' | 'xlarge';
    /** When `circle`, renders as a dot/circle badge. */
    shape?: 'circle';
    /** Extra class name. */
    className?: string;
    /** Badge content (alternative to {@link value}). */
    children?: React.ReactNode;
}

/**
 * A compact count/status badge built on PrimeReact 11's `Badge`. Use for
 * unread counts, notification indicators, and small numeric overlays.
 */
export const Badge = ({ value, severity, size, shape, className, children }: BadgeProps) => (
    <PrimeBadge severity={severity} size={size} shape={shape} className={className} data-severity={severity}>
        {value ?? children}
    </PrimeBadge>
);
