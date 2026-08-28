// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentInstance } from '@primereact/types/core';
import type { ElementType, ReactElement } from 'react';

/**
 * @internal Compile-only bridge for exact upstream declaration defects in PrimeReact 11.1.0 and
 * Arc React 22.4.0. The adapter's packed declaration never exposes these aliases.
 */
declare global {
    type I_1 = ComponentInstance;
    type P = unknown;
    type T_1 = ElementType;

    namespace JSX {
        type Element = ReactElement;
    }
}
