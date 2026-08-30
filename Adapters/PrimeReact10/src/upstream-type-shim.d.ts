// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement } from 'react';

/**
 * @internal Compile-only bridge for PrimeReact 10.9.9 declarations that still name global JSX
 * under React 19 and for the exact Arc React 22.6.0 declaration. It is never emitted or packed.
 */
declare global {
    namespace JSX {
        type Element = ReactElement;
    }
}
