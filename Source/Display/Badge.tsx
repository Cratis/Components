// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

/** Severity tone of a {@link Badge}. */
export type BadgeSeverity =
    'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast';

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

const badgeDescriptor = describeComponent<BadgeProps>('Badge', [
    { name: 'severity', label: 'Severity', type: 'enum', values: ['secondary', 'info', 'success', 'warn', 'danger', 'contrast'] satisfies NonNullable<BadgeProps['severity']>[], defaultValue: 'secondary' },
    { name: 'size', label: 'Size', type: 'enum', values: ['small', 'large', 'xlarge'] satisfies NonNullable<BadgeProps['size']>[], defaultValue: 'small' },
    { name: 'shape', label: 'Shape', type: 'enum', values: ['circle'] satisfies NonNullable<BadgeProps['shape']>[] },
]);

/** A compact count or status badge. */
export const Badge = (props: BadgeProps) => {
    const [presentation, marker] = useComponentPresentation(badgeDescriptor, props);
    const { value, severity = 'secondary', size = 'small', shape, className, children } = presentation;
    return (
        <span
            {...marker}
            className={['cratis-badge', className].filter(Boolean).join(' ')}
            data-cratis-part='root'
            data-severity={severity}
            data-size={size}
            data-shape={shape}
        >
            {value ?? children}
        </span>
    );
};
