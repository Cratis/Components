// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Props for {@link Skeleton}. */
export interface SkeletonProps {
    /** Width, any CSS length. Defaults to `'100%'`. */
    width?: string;
    /** Height, any CSS length. Defaults to `'1rem'`. */
    height?: string;
    /** Border radius, any CSS length. */
    borderRadius?: string;
    /** When true, renders a circle (equal width/height, fully rounded). */
    circle?: boolean;
    /** Extra class name. */
    className?: string;
}

/** A loading placeholder that reserves content layout. */
export const Skeleton = ({ width = '100%', height = '1rem', borderRadius, circle, className }: SkeletonProps) => (
    <span
        className={['cratis-skeleton', className].filter(Boolean).join(' ')}
        data-cratis-part='root'
        data-circle={circle || undefined}
        aria-hidden='true'
        style={{
            width: circle ? height : width,
            height,
            borderRadius: circle ? '50%' : borderRadius,
        }}
    />
);
