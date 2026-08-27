// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes } from 'react';
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

/** A non-interactive semantic surface with a bounded native-element choice. */
export { SurfaceImplementation as Surface } from './SurfaceImplementation';
