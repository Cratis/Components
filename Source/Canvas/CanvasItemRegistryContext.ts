// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import type { CanvasItemRegistryContextValue } from './CanvasItemRegistryContextValue';

/** Context carrying the nearest Canvas item registry. */
export const CanvasItemRegistryContext =
    React.createContext<CanvasItemRegistryContextValue | null>(null);
