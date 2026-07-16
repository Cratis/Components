// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Skeleton as PrimeSkeleton } from 'primereact/skeleton';

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

/**
 * A loading placeholder built on PrimeReact 11's `Skeleton`. Use to reserve
 * layout while a query is loading (e.g. `result.isPerforming`) instead of a
 * blank flash or a spinner.
 */
export const Skeleton = ({ width = '100%', height = '1rem', borderRadius, circle, className }: SkeletonProps) => (
    <PrimeSkeleton
        width={circle ? (height ?? '2rem') : width}
        height={height}
        borderRadius={circle ? '50%' : borderRadius}
        className={className}
    />
);
