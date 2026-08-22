// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { components3PrimeReact11PassThroughContract } from './components3PrimeReact11PassThroughContract';

/** A component name in the Components 3 / PrimeReact 11 pass-through contract. */
export type PrimeReact11PassThroughComponent =
    keyof typeof components3PrimeReact11PassThroughContract.components;
