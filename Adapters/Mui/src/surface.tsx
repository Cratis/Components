// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import MuiPaper from '@mui/material/Paper';
import type { SurfaceProps } from '@cratis/components/Common';
import { classNames } from './shared.js';

export const MuiSurfaceSlot = forwardRef<HTMLElement, SurfaceProps>(function MuiSurfaceSlot(
    { as: Element = 'div', pt, className, style, ...nativeProps },
    ref,
) {
    return (
        <MuiPaper
            {...pt?.root}
            {...nativeProps}
            component={Element}
            ref={ref}
            className={classNames('cratis-mui-surface', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
        />
    );
});
