// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

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

const skeletonDescriptor = describeComponent<SkeletonProps>('Skeleton', [
    { name: 'width', label: 'Width', type: 'string', defaultValue: '100%' },
    { name: 'height', label: 'Height', type: 'string', defaultValue: '1rem' },
    { name: 'borderRadius', label: 'Border radius', type: 'string' },
    { name: 'circle', label: 'Circle', type: 'boolean' },
]);

/** A loading placeholder that reserves content layout. */
export const Skeleton = (props: SkeletonProps) => {
    const [presentation, marker] = useComponentPresentation(skeletonDescriptor, props);
    const { width = '100%', height = '1rem', borderRadius, circle, className } = presentation;
    return (
        <span
            {...marker}
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
};
