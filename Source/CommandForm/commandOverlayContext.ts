// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext } from 'react';

/**
 * Internal: carries a host's `currentValues` overlay to generated fields that sit inside it, so they can
 * derive the reset hint without the caller repeating the prop. Not part of the public API.
 */
export const CommandOverlayContext = createContext<object | undefined>(undefined);
