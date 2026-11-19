// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, useCallback } from 'react';
import { Card as PrimeCard } from 'primereact/card/card.cjs.js';
import type { SurfaceProps } from '@cratis/components/Common';
import { assignRef, classNames } from './shared.js';

export const PrimeSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(function PrimeSurfaceSlot(
    { as: Element = 'div', pt, className, style, children, ...nativeProps },
    ref,
) {
    const surfaceRef = useCallback(
        (element: HTMLElement | null) => assignRef(ref, element),
        [ref],
    );
    return (
        <Element
            {...pt?.root}
            {...nativeProps}
            ref={surfaceRef}
            className={classNames(
                'cratis-primereact10-surface',
                pt?.root?.className,
                className,
            )}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
        >
            <PrimeCard>{children}</PrimeCard>
        </Element>
    );
});
