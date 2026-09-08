// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext } from 'react';

const ToolbarItemVisibilityContext = createContext(true);

export const ToolbarItemVisibilityProvider = ToolbarItemVisibilityContext.Provider;

export const useToolbarItemVisibility = () => useContext(ToolbarItemVisibilityContext);
