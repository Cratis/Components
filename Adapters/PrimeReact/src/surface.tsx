// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import { Card as PrimeCard } from '@primereact/ui/card';
import type { SurfaceProps } from '@cratis/components/Common';
import { classNames } from './shared.js';

export const PrimeSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(function PrimeSurfaceSlot(
    { as: Element = 'div', pt, className, style, ...nativeProps },
    ref,
) {
    return (
        <PrimeCard.Root
            {...pt?.root}
            {...nativeProps}
            as={Element}
            ref={ref}
            className={classNames(
                'cratis-primereact-surface',
                pt?.root?.className,
                className,
            )}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
        />
    );
});
