// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement } from 'react';

/** @internal Temporary compile-only bridge for the exact upstream Arc React declaration issue. */
declare global {
    namespace JSX {
        type Element = ReactElement;
    }
}
