// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type ForwardedRef, type HTMLAttributes } from 'react';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Native elements supported by {@link Surface}. */
export type SurfaceElement = 'article' | 'div' | 'section';

/** Stable Cratis-owned parts for styling a {@link Surface}. */
export interface SurfaceParts {
    /** Native surface element. */
    root?: HTMLAttributes<HTMLElement>;
}

const surfacePartsMatchManifest: ExactPartKeys<SurfaceParts, PartsOf<'Surface'>> = true;
void surfacePartsMatchManifest;

/** Props for {@link Surface}. */
export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
    /** Native semantic element to render. Defaults to `div`. */
    as?: SurfaceElement;
    /** Cratis-owned per-part attributes. */
    pt?: SurfaceParts;
}

const assignSurfaceRef = (ref: ForwardedRef<HTMLElement>, element: HTMLElement | null) => {
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;
};

/** A non-interactive semantic surface with a bounded native-element choice. */
export const Surface = forwardRef<HTMLElement, SurfaceProps>(function Surface(
    { as: Element = 'div', pt, className, style, ...nativeProps },
    ref,
) {
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
});
