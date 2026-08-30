// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext } from 'react';
import type { CratisComponentsConfig } from './CratisComponentsProvider';
import { cratisDefaults } from './CratisComponentsDefaults';

export const CratisComponentsContext = createContext<CratisComponentsConfig>(cratisDefaults);

/** Returns the resolved renderer-independent Components configuration. */
export const useCratisComponentsConfig = (): CratisComponentsConfig =>
    useContext(CratisComponentsContext);
