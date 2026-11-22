// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ForwardedRef } from 'react';
import type { SurfaceProps } from './Surface';

const assignSurfaceRef = (ref: ForwardedRef<HTMLElement>, element: HTMLElement | null) => {
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;
};

/** Core implementation for the semantic-surface presentation slot. */
export const SurfaceImplementation = forwardRef<HTMLElement, SurfaceProps>(
    function SurfaceImplementation(props, ref) {
        const { as: Element = 'div' } = props;
        const { as: _as, pt, className, style, ...nativeProps } = props;
        return (
            <Element
                {...pt?.root}
                {...nativeProps}
                ref={(element) => {
                    assignSurfaceRef(ref, element);
                }}
                className={['cratis-surface', pt?.root?.className, className]
                    .filter(Boolean)
                    .join(' ')}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
            />
        );
    },
);
